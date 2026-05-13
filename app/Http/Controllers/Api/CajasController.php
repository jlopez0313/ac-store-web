<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CajaResource;
use App\Models\Caja;
use Illuminate\Http\Request;

class CajasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $sortField = $request->input('sort_field', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Caja::with(['referencia.categoria', 'bodega', 'compra']);

        if (!$user->hasRole('superadmin')) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referencia', function ($rq) use ($search) {
                    $rq->where('codigo', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%")
                        ->orWhereHas('marca', function ($mq) use ($search) {
                            $mq->where('nombre', 'like', "%{$search}%");
                        });
                });
            });
        }

        // Add dynamic sorting
        if ($sortField === 'referencia_codigo') {
            $query->join('referencias', 'cajas.referencia_id', '=', 'referencias.id')
                  ->orderBy('referencias.codigo', $sortOrder)
                  ->select('cajas.*');
        } elseif ($sortField === 'referencia_descripcion') {
            $query->join('referencias', 'cajas.referencia_id', '=', 'referencias.id')
                  ->orderBy('referencias.descripcion', $sortOrder)
                  ->select('cajas.*');
        } elseif ($sortField === 'bodega_nombre') {
            $query->join('bodegas', 'cajas.bodega_id', '=', 'bodegas.id')
                  ->orderBy('bodegas.nombre', $sortOrder)
                  ->select('cajas.*');
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        return CajaResource::collection(
            $query->paginate($request->input('per_page', 25))
        );
    }
}
