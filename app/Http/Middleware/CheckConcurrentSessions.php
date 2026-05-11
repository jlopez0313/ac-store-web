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
            $currentSessionId = $request->session()->getId();

            // Count other active sessions for this user (excluding the current one)
            $otherSessionsCount = DB::table('sessions')
                ->where('user_id', $user->id)
                ->where('id', '!=', $currentSessionId)
                ->count();

            if ($otherSessionsCount >= $limit) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Has alcanzado el límite de ' . $limit . ' sesiones simultáneas. Por favor, cierra sesión en otro dispositivo para poder ingresar.',
                ]);
            }
        }

        return $next($request);
    }
}
