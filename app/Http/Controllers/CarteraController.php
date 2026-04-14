<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CarteraController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        // Base query for stats (all locals for this account)
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

        // Query for list (paginated)
        $query = User::role('local')
            ->with(['ciudad'])
            ->withSum(['ventas as saldo' => function ($q) {
                $q->where('estado', 'abierta');
            }], 'total')
            ->orderBy('name', 'asc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $tab = $request->query('tab', 'todo');
        if ($tab === 'pendientes') {
            $query->having('saldo', '>', 0);
        }

        $locals = $query->paginate($request->input('per_page', 25))->appends($request->all());

        return Inertia::render('cartera/Index', [
            'lista' => [
                'data' => collect($locals->items())->map(fn($l) => [
                    'id' => $l->id,
                    'nombre' => $l->name,
                    'saldo' => (int)($l->saldo ?? 0),
                    'ciudad' => $l->ciudad?->name ?? 'N/A',
                ]),
                'meta' => [
                    'total' => $locals->total(),
                    'current_page' => $locals->currentPage(),
                    'per_page' => $locals->perPage(),
                ],
            ],
            'stats' => [
                'total_clientes' => $allLocals->count(),
                'con_saldo_pendiente' => $conSaldo,
                'saldo_total' => (int)$totalGeneral,
            ],
            'filters' => $request->all(['search', 'tab', 'per_page']),
        ]);
    }
}
