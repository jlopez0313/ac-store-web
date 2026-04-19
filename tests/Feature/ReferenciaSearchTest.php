<?php

namespace Tests\Feature;

use App\Models\Bodega;
use App\Models\BodegaAcceso;
use App\Models\Categoria;
use App\Models\Cuenta;
use App\Models\Estanteria;
use App\Models\Inventario;
use App\Models\Marca;
use App\Models\Referencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReferenciaSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create necessary roles
        Role::create(['name' => 'superadmin']);
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'bodega']);
        Role::create(['name' => 'local']);
    }

    private function createCategoria($name = 'Cat 1')
    {
        return Categoria::create([
            'nombre' => $name,
            'prefijo_sku' => 'CAT',
            'tipo_control' => 'tallas'
        ]);
    }

    public function test_superadmin_can_access_search_page()
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        $response = $this->actingAs($user)->get(route('referencias.search'));

        $response->assertStatus(200);
    }

    public function test_local_user_only_sees_authorized_warehouses()
    {
        // 1. Setup Cuentas
        $cuenta1 = Cuenta::create(['nombre' => 'Cuenta 1']);
        $cuenta2 = Cuenta::create(['nombre' => 'Cuenta 2']);

        // 2. Setup Bodegas
        $bodega1 = Bodega::create(['nombre' => 'Bodega 1', 'cuenta_id' => $cuenta1->id, 'tipo' => 'punto_venta']);
        $bodega2 = Bodega::create(['nombre' => 'Bodega 2', 'cuenta_id' => $cuenta2->id, 'tipo' => 'punto_venta']);

        // 3. Setup Estanterias
        $est1 = Estanteria::create(['nombre' => 'Est 1', 'bodega_id' => $bodega1->id]);
        $est2 = Estanteria::create(['nombre' => 'Est 2', 'bodega_id' => $bodega2->id]);

        // 4. Setup References
        $cat = $this->createCategoria();
        $marca = Marca::create(['nombre' => 'Marca 1', 'cuenta_id' => $cuenta1->id]);
        $ref = Referencia::create([
            'codigo' => 'REF001',
            'marca_id' => $marca->id,
            'descripcion' => 'Desc 1',
            'categoria_id' => $cat->id,
            'cuenta_id' => $cuenta1->id
        ]);

        // 5. Setup Inventario
        Inventario::create([
            'cuenta_id' => $cuenta1->id,
            'referencia_id' => $ref->id,
            'estanteria_id' => $est1->id,
            'talla' => '38',
            'stock' => 10,
            'precio_venta' => 1000
        ]);

        Inventario::create([
            'cuenta_id' => $cuenta2->id,
            'referencia_id' => $ref->id,
            'estanteria_id' => $est2->id,
            'talla' => '38',
            'stock' => 5,
            'precio_venta' => 1000
        ]);

        // 6. Setup Local User
        $localUser = User::factory()->create(['cuenta_id' => null]);
        $localUser->assignRole('local');

        // Grant access only to Bodega 1
        BodegaAcceso::create([
            'user_id' => $localUser->id,
            'bodega_id' => $bodega1->id,
            'can_view' => true,
            'can_order' => false,
            'cuenta_id' => $cuenta1->id
        ]);

        // 7. Perform Search via API
        $response = $this->actingAs($localUser)->postJson(route('api.referencias.search'), [
            'codigo' => 'REF001'
        ]);

        $response->assertStatus(200);
        $json = $response->json();
        $results = $json['data'];

        // Assert paginated structure
        $this->assertArrayHasKey('total', $json);
        $this->assertArrayHasKey('current_page', $json);
        $this->assertArrayHasKey('data', $json);

        // Assert only Bodega 1 result is seen
        $this->assertCount(1, $results);
        $this->assertEquals('Bodega 1', $results[0]['bodega']);
        $this->assertEquals(10, $results[0]['stock']);
    }

    public function test_admin_only_sees_their_account_inventory()
    {
        $cuenta1 = Cuenta::create(['nombre' => 'Cuenta 1']);
        $cuenta2 = Cuenta::create(['nombre' => 'Cuenta 2']);

        $bodega1 = Bodega::create(['nombre' => 'Bodega 1', 'cuenta_id' => $cuenta1->id, 'tipo' => 'punto_venta']);
        $bodega2 = Bodega::create(['nombre' => 'Bodega 2', 'cuenta_id' => $cuenta2->id, 'tipo' => 'punto_venta']);

        $est1 = Estanteria::create(['nombre' => 'Est 1', 'bodega_id' => $bodega1->id]);
        $est2 = Estanteria::create(['nombre' => 'Est 2', 'bodega_id' => $bodega2->id]);

        $cat = $this->createCategoria('Cat 1');
        $marca1 = Marca::create(['nombre' => 'Marca 1', 'cuenta_id' => $cuenta1->id]);
        $ref1 = Referencia::create(['codigo' => 'R1', 'marca_id' => $marca1->id, 'categoria_id' => $cat->id, 'cuenta_id' => $cuenta1->id]);

        Inventario::create(['cuenta_id' => $cuenta1->id, 'referencia_id' => $ref1->id, 'estanteria_id' => $est1->id, 'talla' => 'S', 'stock' => 10, 'precio_venta' => 100]);
        Inventario::create(['cuenta_id' => $cuenta2->id, 'referencia_id' => $ref1->id, 'estanteria_id' => $est2->id, 'talla' => 'S', 'stock' => 5, 'precio_venta' => 100]);

        $admin = User::factory()->create(['cuenta_id' => $cuenta1->id]);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->postJson(route('api.referencias.search'), ['codigo' => 'R1']);

        $response->assertStatus(200);
        $json = $response->json();
        $results = $json['data'];

        $this->assertCount(1, $results);
        $this->assertEquals('Cuenta 1', $results[0]['cuenta']);
    }
}
