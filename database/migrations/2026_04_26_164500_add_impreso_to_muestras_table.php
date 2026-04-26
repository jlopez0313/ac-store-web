<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add impreso column to muestras table
        Schema::table('muestras', function (Blueprint $table) {
            $table->boolean('impreso')->default(false)->after('estado');
        });

        // Create vista_muestras view
        DB::statement("
            CREATE OR REPLACE VIEW vista_muestras AS
            SELECT
                m.id AS muestra_id,
                c.id AS cuenta_id,
                r.id AS referencia_id,
                r.codigo AS Referencia,
                r.descripcion AS Descripcion,
                m.variante AS Talla,
                CASE
                    WHEN r.sistema_viejo = 1 THEN r.codigo
                    ELSE CONCAT(r.codigo, '-', m.variante)
                END AS CodigoBarras,
                l.name AS LocalDestino,
                m.created_at AS FechaCreacion,
                m.impreso
            FROM muestras m
            INNER JOIN referencias r ON r.id = m.referencia_id
            INNER JOIN users l ON l.id = m.local_id
            INNER JOIN cuentas c ON c.id = m.cuenta_id
            WHERE m.impreso = 0
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS vista_muestras');

        Schema::table('muestras', function (Blueprint $table) {
            $table->dropColumn('impreso');
        });
    }
};
