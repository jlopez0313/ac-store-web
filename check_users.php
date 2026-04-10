<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

foreach(User::all() as $u) {
    echo "ID: {$u->id}, Name: {$u->name}, Cuenta: {$u->cuenta_id}, Roles: " . implode(',', $u->getRoleNames()->toArray()) . "\n";
}
