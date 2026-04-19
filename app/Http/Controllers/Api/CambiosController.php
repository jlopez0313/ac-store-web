<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cambio;
use App\Models\User;
use App\Http\Resources\CambioResource;
use Illuminate\Http\Request;

class CambiosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Cambio::with(['local', 'venta', 'detalleOriginal.producto', 'productoNuevo', 'cuenta', 'creator'])
            ->orderBy('created_at', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('id', 'like', '%' . $request->search . '%')
                  ->orWhere('observacion', 'like', '%' . $request->search . '%')
                  ->orWhereHas('local', fn($l) => $l->where('name', 'like', '%' . $request->search . '%'));
            });
        }

        $paginated = $query->paginate($request->input('per_page', 25));

        return CambioResource::collection($paginated);
    }
}
