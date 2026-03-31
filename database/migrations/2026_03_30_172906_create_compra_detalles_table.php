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
        Schema::create('compra_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referencia_id')->constrained()->restrictOnDelete();
            $table->foreignId('bodega_id')->constrained()->restrictOnDelete();
            $table->string('modo')->default('cajas'); // 'cajas' o 'tallado'
            $table->integer('numero_cajas')->nullable();
            $table->integer('pares_por_caja')->nullable();
            $table->integer('cantidad'); // total pares
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('precio_venta', 10, 2)->default(0);
            $table->json('tallas')->nullable(); // Para guardar el desglose si es tallado
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
            $table->auditable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compra_detalles');
    }
};
