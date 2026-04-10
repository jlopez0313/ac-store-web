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
        Schema::table('bodega_accesos', function (Blueprint $table) {
            $table->decimal('descuento', 5, 2)->default(0)->after('can_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bodega_accesos', function (Blueprint $table) {
            $table->dropColumn('descuento');
        });
    }
};
