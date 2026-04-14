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
        Schema::table('cambios', function (Blueprint $table) {
            $table->foreignId('nueva_venta_id')->nullable()->constrained('ventas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cambios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nueva_venta_id');
        });
    }
};
