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
        Schema::create('bodega_accesos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bodega_id')->constrained('bodegas')->onDelete('cascade');
            $table->foreignId('local_id')->constrained('bodegas')->onDelete('cascade');
            $table->boolean('can_view')->default(false);
            $table->boolean('can_order')->default(false);
            $table->timestamps();
            $table->auditable();

            $table->unique(['bodega_id', 'local_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bodega_accesos');
    }
};
