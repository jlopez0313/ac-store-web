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
        Schema::table('marcas', function (Blueprint $table) {
            // Drop existing global unique index if it exists
            // We use try-catch to avoid error if index name is different
            try {
                $table->dropUnique('marcas_nombre_unique');
            } catch (\Exception $e) {
                // Ignore if not found
            }

            // Create new multi-tenant unique index
            $table->unique(['nombre', 'cuenta_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('marcas', function (Blueprint $table) {
            $table->dropUnique(['nombre', 'cuenta_id']);
            $table->unique('nombre');
        });
    }
};
