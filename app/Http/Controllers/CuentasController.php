<?php

namespace App\Http\Controllers;

use App\Http\Resources\CuentasResource;
use App\Models\Cuenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Request as Peticion;
use Inertia\Inertia;

class CuentasController extends Controller
{
    public function index(Request $request)
    {
        $query = Cuenta::orderBy('nombre');

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . $request->search . '%');
        }

        return Inertia::render('cuentas/Index', [
            'filters'  => Peticion::only(['search', 'trashed', 'per_page']),
            'estados'  => config('constants.estados'),
            'lista'    => CuentasResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
        ]);
    }
}
