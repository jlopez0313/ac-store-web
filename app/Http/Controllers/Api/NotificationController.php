<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string|in:info,success,warning,error',
            'target_type' => 'required|string|in:all,account,user',
            'target_id' => 'nullable',
        ]);

        $users = [];
        if ($request->target_type === 'all') {
            $users = \App\Models\User::all();
        } elseif ($request->target_type === 'account') {
            $users = \App\Models\User::where('cuenta_id', $request->target_id)->get();
        } elseif ($request->target_type === 'user') {
            $user = \App\Models\User::find($request->target_id);
            if ($user) $users = [$user];
        }

        foreach ($users as $user) {
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type ?? 'info',
            ]);
        }

        return response()->json(['message' => 'Notificaciones enviadas correctamente']);
    }

    public function markAsRead(\App\Models\Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Notificación marcada como leída']);
    }

    public function markAllAsRead()
    {
        auth()->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }
}
