<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class CarteraController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        // Base query for stats
        $statsQuery = User::role('local')
            ->withSum(['ventas as saldo' => function ($q) {
                $q->where('estado', 'abierta');
            }], 'total');

        if (!$isSuper) {
            $statsQuery->where('cuenta_id', $user->cuenta_id);
        }

        $allLocals = $statsQuery->get();
        $totalGeneral = $allLocals->sum('saldo');
        $conSaldo = $allLocals->filter(fn($l) => $l->saldo > 0)->count();

        // Query for list
        $query = User::role('local')
            ->with(['ciudad'])
            ->withSum(['ventas as saldo' => function ($q) {
                $q->where('estado', 'abierta');
            }], 'total');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $tab = $request->input('tab', 'todo');
        if ($tab === 'pendientes') {
            $query->having('saldo', '>', 0);
        }

        $sortField = $request->input('sort_field', 'name');
        $sortOrder = $request->input('sort_order', 'asc');

        // Handle relationships or virtual columns if needed
        if ($sortField === 'saldo') {
            $query->orderBy('saldo', $sortOrder);
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $paginated = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => collect($paginated->items())->map(fn($l) => [
                'id' => $l->id,
                'nombre' => $l->name,
                'saldo' => (int)($l->saldo ?? 0),
                'ciudad' => $l->ciudad?->name ?? 'N/A',
            ]),
            'meta' => [
                'total' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'stats' => [
                    'total_clientes' => $allLocals->count(),
                    'con_saldo_pendiente' => $conSaldo,
                    'saldo_total' => (int)$totalGeneral,
                ]
            ],
        ]);
    }
}
