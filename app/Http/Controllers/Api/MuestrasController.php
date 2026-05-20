<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Muestra;
use App\Http\Resources\MuestraResource;
use Illuminate\Http\Request;

class MuestrasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $sortField = $request->input('sort_field', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Muestra::with(['local', 'referencia.categoria', 'cuenta', 'creator', 'inventario.estanteria.bodega']);

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('local_id')) {
            $query->where('local_id', $request->local_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referencia', function ($rq) use ($search) {
                    $rq->where('codigo', 'like', "%$search%")
                        ->orWhere('descripcion', 'like', "%$search%");
                })->orWhereHas('local', fn($l) => $l->where('name', 'like', "%$search%"));
            });
        }

        if ($sortField === 'fecha') {
            $sortField = 'created_at';
        }

        if ($sortField === 'bodega_original' || $sortField === 'estante_original') {
            // Join to sort by related warehouse/shelf
            $query->leftJoin('inventarios', 'muestras.inventario_id', '=', 'inventarios.id')
                  ->leftJoin('estanterias', 'inventarios.estanteria_id', '=', 'estanterias.id')
                  ->leftJoin('bodegas', 'estanterias.bodega_id', '=', 'bodegas.id');
                  
            if ($sortField === 'bodega_original') {
                $query->orderBy('bodegas.nombre', $sortOrder);
            } else {
                $query->orderBy('estanterias.nombre', $sortOrder);
            }
            // Ensure we select only muestras columns to avoid overriding id
            $query->select('muestras.*');
        } elseif ($sortField === 'local_id') {
            $query->leftJoin('users as locales', 'muestras.local_id', '=', 'locales.id')
                  ->orderBy('locales.name', $sortOrder)
                  ->select('muestras.*');
        } elseif ($sortField === 'referencia_codigo' || $sortField === 'referencia_descripcion') {
            $query->leftJoin('referencias', 'muestras.referencia_id', '=', 'referencias.id');
            if ($sortField === 'referencia_codigo') {
                $query->orderBy('referencias.codigo', $sortOrder);
            } else {
                $query->orderBy('referencias.descripcion', $sortOrder);
            }
            $query->select('muestras.*');
        } else {
            $query->orderBy("muestras.$sortField", $sortOrder);
        }

        $paginated = $query->paginate($request->input('per_page', 25));


        return MuestraResource::collection($paginated);
    }

    public function show(Muestra $muestra)
    {
        return new MuestraResource($muestra->load(['local', 'referencia.categoria', 'cuenta', 'inventario.estanteria.bodega']));
    }
}
