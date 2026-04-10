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
        Schema::create('traslados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas');
            $table->foreignId('referencia_id')->constrained('referencias');
            $table->string('talla', 10);
            $table->foreignId('bodega_origen_id')->constrained('bodegas');
            $table->foreignId('estanteria_origen_id')->constrained('estanterias');
            $table->foreignId('bodega_destino_id')->constrained('bodegas');
            $table->foreignId('estanteria_destino_id')->constrained('estanterias');
            $table->integer('cantidad');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traslados');
    }
};
