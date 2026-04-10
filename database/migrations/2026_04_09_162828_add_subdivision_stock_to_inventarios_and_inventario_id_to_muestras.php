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
        Schema::table('inventarios', function (Blueprint $table) {
            $table->json('subdivision_stock')->nullable()->after('stock');
        });

        Schema::table('muestras', function (Blueprint $table) {
            $table->foreignId('inventario_id')->nullable()->after('referencia_id')->constrained('inventarios')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('muestras', function (Blueprint $table) {
            $table->dropForeign(['inventario_id']);
            $table->dropColumn('inventario_id');
        });

        Schema::table('inventarios', function (Blueprint $table) {
            $table->dropColumn('subdivision_stock');
        });
    }
};
