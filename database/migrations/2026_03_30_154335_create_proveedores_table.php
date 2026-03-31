<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->nullable()->constrained('cuentas')->onDelete('cascade');
            $table->string('nombre');
            $table->string('tipo_documento');
            $table->string('documento');
            $table->string('telefono')->nullable();
            $table->string('correo')->nullable();
            $table->auditable();
            $table->timestamps();

            // Garantizar que no se repitan documentos por cuenta
            $table->unique(['cuenta_id', 'documento']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
