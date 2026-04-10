<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bodega_accesos', function (Blueprint $table) {
            if (!Schema::hasColumn('bodega_accesos', 'cuenta_id')) {
                $table->foreignId('cuenta_id')->nullable()->after('can_order')->constrained('cuentas')->onDelete('cascade');
            }
            if (!Schema::hasColumn('bodega_accesos', 'creado_por')) {
                $table->auditable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bodega_accesos', function (Blueprint $table) {
            if (Schema::hasColumn('bodega_accesos', 'cuenta_id')) {
                $table->dropForeign(['cuenta_id']);
                $table->dropColumn('cuenta_id');
            }
            if (Schema::hasColumn('bodega_accesos', 'creado_por')) {
                $table->dropColumn(['creado_por', 'modificado_por', 'eliminado_por']);
            }
        });
    }
};
