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
        Schema::table('muestras', function (Blueprint $table) {
            $table->string('estado')->default('activo')->after('cuenta_id');
        });

        Schema::table('venta_detalles', function (Blueprint $table) {
            $table->foreignId('muestra_id')->nullable()->after('inventario_id')->constrained('muestras')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('venta_detalles', function (Blueprint $table) {
            $table->dropForeign(['muestra_id']);
            $table->dropColumn('muestra_id');
        });

        Schema::table('muestras', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
};
