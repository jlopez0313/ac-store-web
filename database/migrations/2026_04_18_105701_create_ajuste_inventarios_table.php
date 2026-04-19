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
        Schema::create('ajuste_inventarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referencia_id')->constrained('referencias');
            $table->foreignId('estanteria_id')->constrained('estanterias');
            $table->integer('precio_compra_anterior')->nullable();
            $table->integer('precio_compra_nuevo')->nullable();
            $table->integer('precio_venta_anterior')->nullable();
            $table->integer('precio_venta_nuevo')->nullable();
            $table->json('detalle_stock'); // JSON: [{talla: '36', anterior: 10, nuevo: 12}, ...]
            $table->text('observacion')->nullable();
            $table->auditable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ajuste_inventarios');
    }
};
