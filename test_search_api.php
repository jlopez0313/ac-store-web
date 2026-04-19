<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\ReferenciaSearchController;
use Illuminate\Http\Request;
use App\Models\User;

$user = User::where('username', 'admin')->first() ?: User::first();
auth()->login($user);

$request = Request::create('/api/referencias-busqueda', 'POST', [
    'codigo' => '000005'
]);

$controller = new ReferenciaSearchController();
$response = $controller->index($request);

echo $response->getContent();
echo "\n";
