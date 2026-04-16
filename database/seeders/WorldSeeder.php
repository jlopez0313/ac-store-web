<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Nnjeim\World\Actions\SeedAction;

class WorldSeeder extends Seeder
{
	public function run()
	{
		// Solo sembrar si la tabla de países está vacía para ahorrar tiempo
		if (\DB::table('countries')->count() === 0) {
			$this->call([
				SeedAction::class,
			]);
		}
	}
}
