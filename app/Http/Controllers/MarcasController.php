<?php

namespace App\Http\Controllers;

use App\Http\Resources\MarcaResource;
use App\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Marca::withCount('referencias')->orderBy('nombre');

        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%' . $request->search . '%');
        }

        return Inertia::render('marcas/Index', [
            'filters' => $request->only(['search', 'per_page']),
            'lista'   => MarcaResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
        ]);
    }
}
