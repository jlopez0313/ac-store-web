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
        Schema::table('marcas', function (Blueprint $row) {
            $row->auditable();
            $row->foreignId('cuenta_id')->nullable()->constrained('cuentas')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('marcas', function (Blueprint $row) {
            $row->dropColumn(['creado_por', 'modificado_por', 'eliminado_por', 'deleted_at', 'cuenta_id']);
        });
    }
};
