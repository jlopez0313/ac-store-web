<?php

use App\Models\Notification;
use App\Models\Announcement;
use App\Models\User;

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
            $users = User::all();
        } elseif ($request->target_type === 'account') {
            $users = User::where('cuenta_id', $request->target_id)->get();
        } elseif ($request->target_type === 'user') {
            $user = User::find($request->target_id);
            if ($user) $users = [$user];
        }

        if (empty($users)) {
            return response()->json(['message' => 'No se encontraron destinatarios'], 422);
        }

        // Create master announcement for stats
        $announcement = Announcement::create([
            'user_id' => auth()->id(),
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type ?? 'info',
            'target_type' => $request->target_type,
            'target_id' => $request->target_id,
        ]);

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'announcement_id' => $announcement->id,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type ?? 'info',
            ]);
        }

        return response()->json(['message' => 'Notificaciones enviadas correctamente']);
    }

    public function announcementsIndex()
    {
        $announcements = Announcement::withCount(['notifications', 'notifications as read_count' => function ($query) {
            $query->whereNotNull('read_at');
        }])->orderBy('created_at', 'desc')->get();

        return response()->json($announcements);
    }

    public function announcementStats(Announcement $announcement)
    {
        $stats = $announcement->notifications()
            ->with('user:id,name,username')
            ->get()
            ->map(function ($n) {
                return [
                    'user_name' => $n->user->name,
                    'username' => $n->user->username,
                    'read_at' => $n->read_at ? $n->read_at->format('Y-m-d H:i:s') : null,
                ];
            });

        return response()->json([
            'announcement' => $announcement,
            'stats' => $stats
        ]);
    }

    public function markAsRead(Notification $notification)
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
