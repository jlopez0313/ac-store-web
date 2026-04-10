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
        Schema::table('ventas', function (Blueprint $table) {
            $table->bigInteger('subtotal')->default(0)->change();
            $table->bigInteger('total')->default(0)->change();
        });

        Schema::table('venta_detalles', function (Blueprint $table) {
            $table->bigInteger('precio_unitario')->change();
            $table->bigInteger('subtotal')->change();
        });

        Schema::table('inventarios', function (Blueprint $table) {
            $table->bigInteger('precio_compra')->default(0)->change();
            $table->bigInteger('precio_venta')->default(0)->change();
        });

        Schema::table('bodega_accesos', function (Blueprint $table) {
            $table->bigInteger('descuento')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->decimal('subtotal', 15, 2)->default(0)->change();
            $table->decimal('total', 15, 2)->default(0)->change();
        });

        Schema::table('venta_detalles', function (Blueprint $table) {
            $table->decimal('precio_unitario', 15, 2)->change();
            $table->decimal('subtotal', 15, 2)->change();
        });

        Schema::table('inventarios', function (Blueprint $table) {
            $table->decimal('precio_compra', 15, 2)->default(0)->change();
            $table->decimal('precio_venta', 15, 2)->default(0)->change();
        });

        Schema::table('bodega_accesos', function (Blueprint $table) {
            $table->decimal('descuento', 15, 2)->default(0)->change();
        });
    }
};
