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
            // Drop global unique index
            try {
                $table->dropUnique('referencias_codigo_unique');
            } catch (\Exception $e) {
                // Skip if not found
            }

            // Create scoped unique index
            $table->unique(['codigo', 'cuenta_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referencias', function (Blueprint $table) {
            $table->dropUnique(['codigo', 'cuenta_id']);
            $table->unique('codigo');
        });
    }
};
