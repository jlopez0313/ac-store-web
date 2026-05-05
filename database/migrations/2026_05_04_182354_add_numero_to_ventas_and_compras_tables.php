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
            $table->unsignedBigInteger('numero')->nullable()->after('id');
            // Unique per account
            $table->unique(['cuenta_id', 'numero']);
        });

        Schema::table('compras', function (Blueprint $table) {
            $table->unsignedBigInteger('numero')->nullable()->after('id');
            // Unique per account
            $table->unique(['cuenta_id', 'numero']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropUnique(['cuenta_id', 'numero']);
            $table->dropColumn('numero');
        });

        Schema::table('compras', function (Blueprint $table) {
            $table->dropUnique(['cuenta_id', 'numero']);
            $table->dropColumn('numero');
        });
    }
};
