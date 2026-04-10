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
        Schema::create('devoluciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->foreignId('inventario_id')->nullable()->constrained('inventarios')->nullOnDelete();
            $table->foreignId('producto_id')->constrained('referencias')->restrictOnDelete();
            $table->foreignId('bodega_id')->constrained('bodegas')->restrictOnDelete();
            $table->foreignId('estanteria_id')->constrained('estanterias')->restrictOnDelete();
            $table->string('talla');
            $table->integer('cantidad');
            $table->bigInteger('precio_unitario');
            $table->bigInteger('subtotal');
            $table->timestamp('fecha_devolucion')->useCurrent();
            $table->timestamps();
            $table->auditable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devoluciones');
    }
};
