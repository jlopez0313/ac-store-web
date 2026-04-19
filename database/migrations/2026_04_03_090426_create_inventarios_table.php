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
        Schema::create('inventarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas')->cascadeOnDelete();
            $table->foreignId('referencia_id')->constrained('referencias')->cascadeOnDelete();
            $table->foreignId('estanteria_id')->constrained('estanterias')->cascadeOnDelete();
            $table->string('talla', 20)->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('stock')->default(0);
            $table->decimal('precio_compra', 12, 2)->default(0);
            $table->decimal('precio_venta', 12, 2)->default(0);
            $table->timestamps();
            $table->auditable();

            $table->unique(['referencia_id', 'estanteria_id', 'talla'], 'inv_ref_est_talla_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventarios');
    }
};
