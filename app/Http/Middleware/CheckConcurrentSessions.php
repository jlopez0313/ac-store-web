<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckConcurrentSessions
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $limit = $user->limite_sesiones ?? 2;

            // Get all sessions for this user, ordered by last activity (newest first)
            $sessions = DB::table('sessions')
                ->where('user_id', $user->id)
                ->orderBy('last_activity', 'desc')
                ->get();

            if ($sessions->count() > $limit) {
                // Keep the 'limit' newest sessions, delete the rest
                $sessionsToDelete = $sessions->slice($limit);
                
                DB::table('sessions')
                    ->whereIn('id', $sessionsToDelete->pluck('id'))
                    ->delete();
            }
        }

        return $next($request);
    }
}
