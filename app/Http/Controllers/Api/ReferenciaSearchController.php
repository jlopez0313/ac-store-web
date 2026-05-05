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
        
        $query = Referencia::with(['marca', 'cuenta'])
            ->withSum(['inventarios as total_stock' => function ($q) use ($user, $isSuper, $request) {
                $q->where('stock', '>', 0);
                if ($request->filled('talla')) {
                    $q->where('talla', 'like', '%' . $request->talla . '%');
                }
                if (!$isSuper) {
                    if ($user->hasRole('local')) {
                        $q->whereHas('estanteria.bodega.bodegaAccesos', function ($aq) use ($user) {
                            $aq->where('user_id', $user->id)
                               ->where(function ($sq) {
                                   $sq->where('can_view', true)->orWhere('can_order', true);
                               });
                        });
                    } else {
                        $q->where('cuenta_id', $user->cuenta_id);
                    }
                } elseif ($request->filled('cuenta_id') && $request->cuenta_id !== 'all') {
                    $q->where('cuenta_id', $request->cuenta_id);
                }
            }], 'stock')
            ->whereHas('inventarios', function ($q) use ($user, $isSuper, $request) {
                $q->where('stock', '>', 0);
                
                if ($request->filled('talla')) {
                    $q->where('talla', 'like', '%' . $request->talla . '%');
                }

                if (!$isSuper) {
                    if ($user->hasRole('local')) {
                        $q->whereHas('estanteria.bodega.bodegaAccesos', function ($aq) use ($user) {
                            $aq->where('user_id', $user->id)
                               ->where(function ($sq) {
                                   $sq->where('can_view', true)->orWhere('can_order', true);
                               });
                        });
                    } else {
                        $q->where('cuenta_id', $user->cuenta_id);
                    }
                } elseif ($request->filled('cuenta_id') && $request->cuenta_id !== 'all') {
                    $q->where('cuenta_id', $request->cuenta_id);
                }
            });

        // Search filters
        if ($request->filled('marca')) {
            $query->whereHas('marca', function ($q) use ($request) {
                $q->where('nombre', 'like', '%' . $request->marca . '%');
            });
        }

        if ($request->filled('codigo')) {
            $query->where('codigo', 'like', '%' . $request->codigo . '%');
        }

        if ($request->filled('referencia')) {
            $query->where('descripcion', 'like', '%' . $request->referencia . '%');
        }

        $perPage = $request->input('per_page', 10);
        $paginated = $query->paginate($perPage);

        $results = [
            'data' => $paginated->getCollection()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'codigo' => $item->codigo,
                    'marca' => $item->marca->nombre ?? 'N/A',
                    'descripcion' => $item->descripcion,
                    'stock' => (int) $item->total_stock,
                    'foto' => $item->foto,
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
