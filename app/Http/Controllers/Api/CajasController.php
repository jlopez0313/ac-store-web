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
        $query = Caja::with(['referencia.categoria', 'bodega', 'compra'])->orderBy('id', 'desc');

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

        return CajaResource::collection(
            $query->paginate($request->input('per_page', 25))
        );
    }
}
