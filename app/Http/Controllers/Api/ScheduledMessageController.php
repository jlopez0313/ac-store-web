<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScheduledMessage;
use Illuminate\Http\Request;

class ScheduledMessageController extends Controller
{
    /**
     * Display a listing of the scheduled messages.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        
        $messages = ScheduledMessage::where('userId', $userId)
            ->where(function($query) {
                $query->where('status', 'pending')
                      ->orWhere('status', 'sent');
            })
            ->whereDate('scheduledTime', '>=', now()->startOfDay())
            ->get();

        return response()->json($messages);
    }

    /**
     * Store a newly created scheduled message.
     */
    public function store(Request $request)
    {
        $request->validate([
            'to' => 'required|string',
            'message' => 'nullable|string',
            'scheduledTime' => 'required|date',
            'userId' => 'required', // Puede ser numérico (bigint) o string
        ]);

        $message = ScheduledMessage::create([
            'userId' => $request->userId,
            'cuenta_id' => $request->accountId,
            'referenceCode' => $request->referenceCode,
            'recipient' => $request->to,
            'message' => $request->message,
            'media' => $request->media ? json_encode($request->media) : null,
            'scheduledTime' => \Carbon\Carbon::parse($request->scheduledTime)->timezone(config('app.timezone')),
            'status' => 'pending'
        ]);

        return response()->json(['success' => true, 'message' => 'Mensaje programado correctamente.', 'messageId' => $message->id]);
    }

    /**
     * Update the specified scheduled message.
     */
    public function update(Request $request, $messageId)
    {
        $request->validate([
            'to' => 'required|string',
            'message' => 'nullable|string',
            'scheduledTime' => 'required|date',
        ]);

        $message = ScheduledMessage::where('id', $messageId)
            ->where('userId', $request->user()->id)
            ->where('status', 'pending')
            ->first();

        if (!$message) {
            return response()->json(['error' => 'No se encontró el mensaje o ya no está pendiente.'], 404);
        }

        $message->update([
            'recipient' => $request->to,
            'message' => $request->message,
            'media' => $request->media ? json_encode($request->media) : null,
            'scheduledTime' => \Carbon\Carbon::parse($request->scheduledTime)->timezone(config('app.timezone')),
        ]);

        return response()->json(['success' => true, 'message' => 'Mensaje programado actualizado correctamente.']);
    }

    /**
     * Remove the specified scheduled message.
     */
    public function destroy(Request $request, $messageId)
    {
        $message = ScheduledMessage::where('id', $messageId)
            ->where('userId', $request->user()->id)
            ->where('status', 'pending')
            ->first();

        if (!$message) {
            return response()->json(['error' => 'No se encontró el mensaje o ya no está pendiente.'], 404);
        }

        $message->delete();

        return response()->json(['success' => true, 'message' => 'Mensaje programado eliminado correctamente.']);
    }
}
