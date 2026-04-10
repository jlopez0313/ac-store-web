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
        Schema::table('compra_detalles', function (Blueprint $table) {
            $table->bigInteger('precio_unitario')->change();
            $table->bigInteger('precio_venta')->default(0)->change();
            $table->bigInteger('subtotal')->change();
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->bigInteger('precio_compra')->change();
            $table->bigInteger('precio_venta')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('compra_detalles', function (Blueprint $table) {
            $table->decimal('precio_unitario', 15, 2)->change();
            $table->decimal('precio_venta', 10, 2)->default(0)->change();
            $table->decimal('subtotal', 15, 2)->change();
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->decimal('precio_compra', 12, 2)->change();
            $table->decimal('precio_venta', 12, 2)->change();
        });
    }
};
