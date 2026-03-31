<?php

namespace App\Providers;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\ServiceProvider;

class MigrationMacrosServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Blueprint::macro('auditable', function () {
            $this->softDeletes();
            $this->foreignId('creado_por')->nullable()->constrained('users');
            $this->foreignId('modificado_por')->nullable()->constrained('users');
            $this->foreignId('eliminado_por')->nullable()->constrained('users');
        });
    }
}
