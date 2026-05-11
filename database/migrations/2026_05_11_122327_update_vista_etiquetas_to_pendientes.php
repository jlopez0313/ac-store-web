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
        DB::statement("
            CREATE OR REPLACE VIEW vista_etiquetas AS
            SELECT
                ep.id AS id,
                c.id AS cuenta_id,
                c.nombre AS Cuenta,
                COALESCE(m.nombre, 'N/A') AS Marca,
                CAST(COALESCE(r.descripcion, '') AS CHAR(255)) AS Descripcion,
                ep.talla AS Talla,
                CASE
                    WHEN r.sistema_viejo = 1 THEN r.codigo
                    ELSE CONCAT(r.codigo, '-', ep.talla)
                END AS CodigoBarras,
                COALESCE(b.nombre, '') AS Bodega,
                COALESCE(e.nombre, '') AS Estanteria,
                ep.cantidad AS Stock,
                ep.impreso AS Ya_Impreso
            FROM etiquetas_pendientes ep
            INNER JOIN referencias r ON r.id = ep.referencia_id
            LEFT JOIN marcas m ON m.id = r.marca_id
            LEFT JOIN estanterias e ON e.id = ep.estanteria_id
            LEFT JOIN bodegas b ON b.id = e.bodega_id
            LEFT JOIN cuentas c ON c.id = ep.cuenta_id
            WHERE ep.impreso = 0
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            CREATE OR REPLACE VIEW vista_etiquetas AS
            SELECT
                i.id AS inventario_id,
                c.id AS cuenta_id,
                c.nombre AS Cuenta,
                COALESCE(m.nombre, 'N/A') AS Marca,
                CAST(COALESCE(r.descripcion, '') AS CHAR(255)) AS Descripcion,
                i.talla AS Talla,
                CASE
                    WHEN r.sistema_viejo = 1 THEN r.codigo
                    ELSE CONCAT(r.codigo, '-', i.talla)
                END AS CodigoBarras,
                COALESCE(b.nombre, '') AS Bodega,
                COALESCE(e.nombre, '') AS Estanteria,
                i.stock AS Stock,
                r.impreso AS Ya_Impreso
            FROM inventarios i
            INNER JOIN referencias r ON r.id = i.referencia_id
            LEFT JOIN marcas m ON m.id = r.marca_id
            LEFT JOIN estanterias e ON e.id = i.estanteria_id
            LEFT JOIN bodegas b ON b.id = e.bodega_id
            LEFT JOIN cuentas c ON c.id = i.cuenta_id
            WHERE i.stock > 0 AND r.impreso = 0
        ");
    }
};
