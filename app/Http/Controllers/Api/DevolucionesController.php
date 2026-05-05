<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DevolucionResource;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;

class DevolucionesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = VentaDetalle::onlyTrashed()
            ->whereHas('venta', function ($q) use ($user, $isSuper) {
                $q->withTrashed();
                if (!$isSuper) {
                    $q->where('cuenta_id', $user->cuenta_id);
                }
            })
            ->with(['venta' => fn($q) => $q->withTrashed(), 'venta.local', 'venta.cuenta', 'producto', 'bodega', 'estanteria', 'eliminador'])
            ->orderBy('deleted_at', 'desc');

        if ($request->filled('local_id')) {
            $query->whereHas('venta', function ($q) use ($request) {
                $q->where('user_id', $request->local_id);
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('deleted_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('deleted_at', '<=', $request->to);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->whereHas('producto', fn($p) => $p->where('codigo', 'like', '%' . $request->search . '%'))
                  ->orWhere('observacion', 'like', '%' . $request->search . '%');
            });
        }

        $paginated = $query->paginate($request->input('per_page', 25));

        return DevolucionResource::collection($paginated);
    }
}
