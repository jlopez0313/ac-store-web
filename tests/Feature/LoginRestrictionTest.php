<?php

namespace Tests\Feature;

use App\Models\Cuenta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginRestrictionTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_login()
    {
        $cuenta = Cuenta::create(['nombre' => 'Test Account', 'estado' => true]);
        $user = User::factory()->create([
            'email' => 'active@example.com',
            'password' => bcrypt('password'),
            'estado' => true,
            'cuenta_id' => $cuenta->id,
        ]);

        $response = $this->post('/login', [
            'email' => 'active@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_inactive_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => bcrypt('password'),
            'estado' => false,
        ]);

        $response = $this->post('/login', [
            'email' => 'inactive@example.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_user_with_inactive_account_cannot_login()
    {
        $cuenta = Cuenta::create(['nombre' => 'Inactive Account', 'estado' => false]);
        $user = User::factory()->create([
            'email' => 'inactive-account@example.com',
            'password' => bcrypt('password'),
            'estado' => true,
            'cuenta_id' => $cuenta->id,
        ]);

        $response = $this->post('/login', [
            'email' => 'inactive-account@example.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_user_with_expired_subscription_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'expired-user@example.com',
            'password' => bcrypt('password'),
            'estado' => true,
            'fecha_vencimiento' => now()->subDay(),
        ]);

        $response = $this->post('/login', [
            'email' => 'expired-user@example.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_user_with_expired_account_subscription_cannot_login()
    {
        $cuenta = Cuenta::create([
            'nombre' => 'Expired Account', 
            'estado' => true,
            'fecha_vencimiento' => now()->subDay(),
        ]);
        $user = User::factory()->create([
            'email' => 'expired-account@example.com',
            'password' => bcrypt('password'),
            'estado' => true,
            'cuenta_id' => $cuenta->id,
        ]);

        $response = $this->post('/login', [
            'email' => 'expired-account@example.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}
