<?php

namespace App\Http\Controllers;

use App\Http\Resources\InventarioResource;
use App\Models\Inventario;
use App\Models\Referencia;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventariosController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Referencia::with(['categoria', 'marca'])
            ->withSum(['inventarios as total_stock' => function ($q) use ($user, $isSuper) {
                if (!$isSuper) {
                    $q->where('cuenta_id', $user->cuenta_id);
                }
            }], 'stock')
            ->withMax(['inventarios as precio_venta' => function ($q) use ($user, $isSuper) {
                if (!$isSuper) {
                    $q->where('cuenta_id', $user->cuenta_id);
                }
            }], 'precio_venta')
            ->orderBy('id', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%")
                  ->orWhereHas('marca', function ($mq) use ($search) {
                      $mq->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        // Only show references that have had inventory (or show all, user asked for grouped inventory)
        // Usually, if stock is 0 but it exists, it should show.
        
        $paginated = $query->paginate($request->input('per_page', 25))->appends($request->all());

        return Inertia::render('inventario/Index', [
            'filters' => $request->only(['search', 'per_page']),
            'lista' => \App\Http\Resources\ReferenciaResource::collection($paginated),
        ]);
    }

    public function detail(Referencia $referencia)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Inventario::where('referencia_id', $referencia->id)
            ->with(['estanteria.bodega'])
            ->orderBy('stock', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        return response()->json([
            'data' => InventarioResource::collection($query->get())
        ]);
    }
}
