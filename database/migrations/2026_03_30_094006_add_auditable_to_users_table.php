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
        Schema::table('users', function (Blueprint $table) {
            $table->auditable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['creado_por']);
            $table->dropForeign(['modificado_por']);
            $table->dropForeign(['eliminado_por']);
            $table->dropColumn(['creado_por', 'modificado_por', 'eliminado_por', 'deleted_at']);
        });
    }
};
