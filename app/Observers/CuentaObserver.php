<?php

namespace App\Observers;

use App\Models\Cuenta;
use Illuminate\Support\Facades\DB;

class CuentaObserver
{
    /**
     * Handle the Cuenta "created" event.
     */
    public function created(Cuenta $cuenta): void
    {
        $viewName = "vista_etiquetas_cuenta_{$cuenta->id}";

        DB::statement("
            CREATE OR REPLACE VIEW `{$viewName}` AS
            SELECT Marca, Descripcion, Talla, CodigoBarras, Bodega, Estanteria, Stock
            FROM vista_etiquetas
            WHERE cuenta_id = {$cuenta->id}
        ");

        // MySQL User Automation
        $dbName = DB::getDatabaseName();
        $rawName = str_replace(' ', '', $cuenta->nombre);
        $username = strtolower(preg_replace('/[^A-Za-z0-9]/', '', $rawName));
        $username = substr($username, 0, 32); // MySQL limit

        if (!empty($username)) {
            try {
                // Crear usuario con permisos limitados a su vista
                $password = ucfirst($username) . "@2026";
                DB::statement("DROP USER IF EXISTS '{$username}'@'%'");
                DB::statement("CREATE USER '{$username}'@'%' WITH mysql_native_password IDENTIFIED BY '{$password}'");
                DB::statement("GRANT SELECT ON `{$dbName}`.`{$viewName}` TO '{$username}'@'%'");
                DB::statement("FLUSH PRIVILEGES");
                \Log::info("MySQL user created: {$username} with access to {$viewName}");
            } catch (\Exception $e) {
                \Log::error("Error creating MySQL user for account {$cuenta->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle the Cuenta "deleted" event.
     */
    public function deleted(Cuenta $cuenta): void
    {
        $viewName = "vista_etiquetas_cuenta_{$cuenta->id}";
        DB::statement("DROP VIEW IF EXISTS `{$viewName}`");

        // MySQL User cleanup
        $rawName = str_replace(' ', '', $cuenta->nombre);
        $username = strtolower(preg_replace('/[^A-Za-z0-9]/', '', $rawName));
        $username = substr($username, 0, 32);

        if (!empty($username)) {
            try {
                DB::statement("DROP USER IF EXISTS '{$username}'@'%'");
                \Log::info("MySQL user dropped: {$username}");
            } catch (\Exception $e) {
                \Log::error("Error dropping MySQL user for account {$cuenta->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle the Cuenta "force deleted" event.
     */
    public function forceDeleted(Cuenta $cuenta): void
    {
        $this->deleted($cuenta);
    }
}
