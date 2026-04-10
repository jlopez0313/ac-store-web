<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$locals = User::role('local')->get();
echo "Total Locals: " . $locals->count() . "\n";
foreach($locals as $l) {
    echo "ID: {$l->id}, Name: {$l->name}, Cuenta: {$l->cuenta_id}\n";
}
