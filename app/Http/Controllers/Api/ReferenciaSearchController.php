<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cuenta;
use App\Models\Inventario;
use App\Models\Marca;
use Illuminate\Http\Request;

class ReferenciaSearchController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->hasRole('superadmin');
        
        $query = Inventario::with(['referencia.marca', 'estanteria.bodega'])
            ->where('stock', '>', 0);

        // Apply filters based on role
        if ($isSuper) {
            if ($request->filled('cuenta_id')) {
                $query->where('cuenta_id', $request->cuenta_id);
            }
        } elseif ($user->hasRole('local')) {
            // Local users only see what they have access to
            $query->whereHas('estanteria.bodega.bodegaAccesos', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->where(function ($sq) {
                      $sq->where('can_view', true)
                         ->orWhere('can_order', true);
                  });
            });
        } else {
            // Admin/Bodega users only see their account's inventory
            $query->where('cuenta_id', $user->cuenta_id);
        }

        // Search filters
        if ($request->filled('marca')) {
            $query->whereHas('referencia.marca', function ($q) use ($request) {
                $q->where('nombre', 'like', '%' . $request->marca . '%');
            });
        }

        if ($request->filled('codigo')) {
            $query->whereHas('referencia', function ($q) use ($request) {
                $q->where('codigo', 'like', '%' . $request->codigo . '%');
            });
        }

        if ($request->filled('referencia')) {
            $query->whereHas('referencia', function ($q) use ($request) {
                $q->where('descripcion', 'like', '%' . $request->referencia . '%');
            });
        }

        if ($request->filled('talla')) {
            $query->where('talla', 'like', '%' . $request->talla . '%');
        }

        $perPage = $request->input('per_page', 10);
        $paginated = $query->paginate($perPage);

        $results = [
            'data' => $paginated->getCollection()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'codigo' => $item->referencia->codigo,
                    'marca' => $item->referencia->marca->nombre ?? 'N/A',
                    'descripcion' => $item->referencia->descripcion,
                    'talla' => $item->talla,
                    'stock' => $item->stock,
                    'bodega' => $item->estanteria->bodega->nombre,
                    'cuenta' => $item->cuenta->nombre ?? 'N/A',
                ];
            }),
            'total' => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'per_page' => $paginated->perPage(),
        ];

        return response()->json($results);
    }
}
