<?php

namespace App\Http\Controllers;

use App\Http\Resources\DevolucionResource;
use App\Models\Devolucion;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DevolucionesController extends Controller
{
    public function index(Request $request)
    {
        $query = Devolucion::with(['venta.local', 'producto', 'bodega', 'estanteria', 'creator'])
            ->orderBy('fecha_devolucion', 'desc');

        if ($request->filled('local_id')) {
            $query->whereHas('venta', function ($q) use ($request) {
                $q->where('user_id', $request->local_id);
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('fecha_devolucion', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('fecha_devolucion', '<=', $request->to);
        }

        $devoluciones = $query->paginate($request->input('per_page', 25))->appends($request->all());

        $locals = \App\Models\User::role('local')->get(['id', 'name']);

        return Inertia::render('devoluciones/Index', [
            'devoluciones' => DevolucionResource::collection($devoluciones),
            'locals' => $locals,
            'filters' => $request->only(['local_id', 'from', 'to', 'per_page'])
        ]);
    }
}
