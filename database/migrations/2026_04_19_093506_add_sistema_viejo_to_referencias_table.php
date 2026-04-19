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
        Schema::table('referencias', function (Blueprint $table) {
            $table->boolean('sistema_viejo')->default(false)->after('cuenta_id');
        });

        // Marcar todas las referencias actuales como del sistema viejo
        \DB::table('referencias')->update(['sistema_viejo' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referencias', function (Blueprint $table) {
            $table->dropColumn('sistema_viejo');
        });
    }
};
