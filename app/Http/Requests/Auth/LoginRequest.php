<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $loginField = filter_var($this->email, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        
        // Find user first to check status and provide specific error message
        $user = \App\Models\User::where($loginField, $this->email)->first();

        if ($user && !$user->estado) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => 'Su usuario se encuentra inactivo. Por favor contacte al administrador.',
            ]);
        }

        if (! Auth::attempt([$loginField => $this->email, 'password' => $this->password, 'estado' => true], $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Check account status if applicable
        $user = Auth::user();

        // Check if user subscription is expired
        if ($user->fecha_vencimiento && \Illuminate\Support\Carbon::parse($user->fecha_vencimiento)->isPast()) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Su suscripción de usuario ha vencido. Por favor contacte al administrador.',
            ]);
        }

        if ($user->cuenta_id) {
            // Check account status
            if (!$user->cuenta->estado) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'email' => 'Su cuenta se encuentra inactiva. Por favor contacte al soporte.',
                ]);
            }

            // Check if account subscription is expired
            if ($user->cuenta->fecha_vencimiento && \Illuminate\Support\Carbon::parse($user->cuenta->fecha_vencimiento)->isPast()) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'email' => 'La suscripción de su cuenta ha vencido. Por favor contacte al administrador.',
                ]);
            }
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
