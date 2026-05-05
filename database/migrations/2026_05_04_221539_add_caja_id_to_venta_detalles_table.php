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
        Schema::table('venta_detalles', function (Blueprint $table) {
            $table->foreignId('caja_id')->nullable()->after('muestra_id')->constrained('cajas')->onDelete('set null');
            $table->boolean('es_caja')->default(false)->after('caja_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('venta_detalles', function (Blueprint $table) {
            $table->dropForeign(['caja_id']);
            $table->dropColumn(['caja_id', 'es_caja']);
        });
    }
};
