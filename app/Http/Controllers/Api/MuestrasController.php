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

        $query->orderBy($sortField, $sortOrder);
        $paginated = $query->paginate($request->input('per_page', 25));

        return MuestraResource::collection($paginated);
    }

    public function show(Muestra $muestra)
    {
        return new MuestraResource($muestra->load(['local', 'referencia.categoria', 'cuenta', 'inventario.estanteria.bodega']));
    }
}
