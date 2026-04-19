<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('precio_suscripcion', 10, 2)->nullable();
            $table->date('fecha_vencimiento')->nullable();
        });

        Schema::table('cuentas', function (Blueprint $table) {
            $table->decimal('precio_suscripcion', 10, 2)->nullable();
            $table->date('fecha_vencimiento')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['precio_suscripcion', 'fecha_vencimiento']);
        });

        Schema::table('cuentas', function (Blueprint $table) {
            $table->dropColumn(['precio_suscripcion', 'fecha_vencimiento']);
        });
    }
};
