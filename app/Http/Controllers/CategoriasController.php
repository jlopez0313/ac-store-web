<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Categoria::orderBy('nombre');

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . $request->search . '%')
                  ->orWhere('prefijo_sku', 'like', '%' . $request->search . '%');
        }

        return Inertia::render('categorias/Index', [
            'filters' => $request->only(['search']),
            'lista'   => CategoriaResource::collection(
                $query->paginate($request->input('per_page', 10))->appends($request->all())
            ),
            'tipos_control' => [
                ['id' => 'unidades', 'name' => 'Unidades'],
                ['id' => 'tallas', 'name' => 'Tallas'],
            ],
        ]);
    }
}
