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
        Schema::table('bodega_accesos', function (Blueprint $table) {
            // Drop existing foreign key and rename column
            $table->dropForeign(['local_id']);
            $table->renameColumn('local_id', 'user_id');
        });

        Schema::table('bodega_accesos', function (Blueprint $table) {
            // Add new foreign key pointing to users
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bodega_accesos', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->renameColumn('user_id', 'local_id');
        });

        Schema::table('bodega_accesos', function (Blueprint $table) {
            $table->foreign('local_id')->references('id')->on('bodegas')->onDelete('cascade');
        });
    }
};
