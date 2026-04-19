<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use App\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferenciaSearchController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->hasRole('superadmin');
        
        return Inertia::render('referencias/Search', [
            'results' => [], // Empty results on initial load
            'filters' => [
                'marca' => '',
                'codigo' => '',
                'referencia' => '',
                'talla' => '',
                'cuenta_id' => 'all',
            ],
            'cuentas' => $isSuper ? Cuenta::all(['id', 'nombre']) : [],
            'marcas' => Marca::all(['id', 'nombre']),
        ]);
    }
}
