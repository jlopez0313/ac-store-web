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
        if (!Schema::hasTable('ventas')) {
            Schema::create('ventas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->comment('El local receptor')->constrained('users')->onDelete('cascade');
                $table->foreignId('cuenta_id')->constrained('cuentas')->onDelete('cascade');
                $table->timestamp('fecha');
                $table->enum('estado', ['abierta', 'cerrada'])->default('abierta');
                $table->text('observaciones')->nullable();
                $table->decimal('subtotal', 15, 2)->default(0);
                $table->decimal('total', 15, 2)->default(0);
                $table->auditable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('venta_detalles')) {
            Schema::create('venta_detalles', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('venta_id');
                $table->unsignedBigInteger('producto_id');
                $table->unsignedBigInteger('bodega_id')->nullable();
                $table->string('talla', 10)->nullable();
                $table->integer('cantidad');
                $table->decimal('precio_unitario', 15, 2);
                $table->decimal('subtotal', 15, 2);
                $table->timestamps();

                $table->foreign('venta_id')->references('id')->on('ventas')->onDelete('cascade');
                $table->foreign('producto_id')->references('id')->on('referencias')->onDelete('cascade');
                $table->foreign('bodega_id')->references('id')->on('bodegas')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venta_detalles');
        Schema::dropIfExists('ventas');
    }
};
