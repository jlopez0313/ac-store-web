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
        Schema::create('etiquetas_pendientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas')->onDelete('cascade');
            $table->foreignId('referencia_id')->constrained('referencias')->onDelete('cascade');
            $table->foreignId('estanteria_id')->constrained('estanterias')->onDelete('cascade');
            $table->string('talla');
            $table->integer('cantidad')->default(1);
            $table->boolean('impreso')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('etiquetas_pendientes');
    }
};
