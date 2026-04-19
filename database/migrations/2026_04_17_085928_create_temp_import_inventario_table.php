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
        Schema::create('temp_import_inventario', function (Blueprint $table) {
            $table->id();
            $table->string('upload_id')->index();
            $table->string('fc')->nullable();
            $table->string('ref')->nullable();
            $table->string('talla')->nullable();
            $table->string('ubicacion')->nullable();
            $table->integer('cantidad')->default(0);
            $table->integer('p_costo')->default(0);
            $table->integer('p_venta')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temp_import_inventario');
    }
};
