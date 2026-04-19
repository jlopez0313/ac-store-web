<?php

namespace Tests\Feature;

use Tests\TestCase;

class TranslationTest extends TestCase
{
    public function test_auth_failed_message_is_in_spanish()
    {
        $this->assertEquals('es', app()->getLocale());
        $this->assertEquals('Estas credenciales no coinciden con nuestros registros.', __('auth.failed'));
    }

    public function test_validation_messages_are_in_spanish()
    {
        $response = $this->post('/login', [
            'email' => '',
            'password' => '',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'El campo correo electrónico es obligatorio.',
        ]);
    }
}
