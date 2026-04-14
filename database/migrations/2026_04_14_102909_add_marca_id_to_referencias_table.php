<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add marca_id column (allowing null for the transition)
        Schema::table('referencias', function (Blueprint $row) {
            $row->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
        });

        // 2. Data Migration: Populate 'marcas' from unique 'referencias.marca'
        $uniqueMarcas = DB::table('referencias')
            ->whereNotNull('marca')
            ->pluck('marca')
            ->unique()
            ->filter();

        foreach ($uniqueMarcas as $marcaNombre) {
            $marcaId = DB::table('marcas')->insertGetId([
                'nombre' => $marcaNombre,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Map this brand to the references
            DB::table('referencias')
                ->where('marca', $marcaNombre)
                ->update(['marca_id' => $marcaId]);
        }

        // 3. Drop the old column
        Schema::table('referencias', function (Blueprint $row) {
            $row->dropColumn('marca');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse is tricky since we dropped the string column.
        // We'll re-add 'marca' and populate it from the 'marcas' relationship.
        Schema::table('referencias', function (Blueprint $row) {
            $row->string('marca')->nullable();
        });

        $referencias = DB::table('referencias')
            ->join('marcas', 'referencias.marca_id', '=', 'marcas.id')
            ->select('referencias.id', 'marcas.nombre')
            ->get();

        foreach ($referencias as $r) {
            DB::table('referencias')->where('id', $r->id)->update(['marca' => $r->nombre]);
        }

        Schema::table('referencias', function (Blueprint $row) {
            $row->dropForeign(['marca_id']);
            $row->dropColumn('marca_id');
        });
    }
};
