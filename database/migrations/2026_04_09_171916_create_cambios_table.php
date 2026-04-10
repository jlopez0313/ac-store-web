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
        Schema::create('cambios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas');
            $table->foreignId('local_id')->constrained('users');
            $table->foreignId('venta_id')->constrained('ventas');
            $table->foreignId('venta_detalle_id')->constrained('venta_detalles');
            $table->foreignId('nuevo_producto_id')->constrained('referencias');
            $table->foreignId('nuevo_inventario_id')->constrained('inventarios');
            $table->string('talla_nueva');
            $table->integer('precio_original');
            $table->integer('precio_nuevo');
            $table->integer('diferencia');
            $table->string('status')->default('completado');
            $table->auditable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cambios');
    }
};
