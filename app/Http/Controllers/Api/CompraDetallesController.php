<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\CompraDetalle;
use Illuminate\Http\Request;

class CompraDetallesController extends Controller
{
    public function store(Request $request, Compra $compra)
    {
        $validated = $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
            'bodega_id' => 'required|exists:bodegas,id',
            'modo' => 'required|in:cajas,tallado',
            'numero_cajas' => 'nullable|integer',
            'pares_por_caja' => 'nullable|integer',
            'cantidad' => 'required|integer|min:1',
            'precio_unitario' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'tallas' => 'nullable|array',
            'tallas.*.size' => 'required_with:tallas|string',
            'tallas.*.qty' => 'required_with:tallas|integer|min:0',
            'tallas.*.estanteria_id' => 'required_if:modo,tallado|exists:estanterias,id',
        ]);

        $subtotal = $validated['cantidad'] * $validated['precio_unitario'];

        $detalle = $compra->detalles()->create([
            'referencia_id' => $validated['referencia_id'],
            'bodega_id' => $validated['bodega_id'],
            'modo' => $validated['modo'],
            'numero_cajas' => $validated['numero_cajas'] ?? null,
            'pares_por_caja' => $validated['pares_por_caja'] ?? null,
            'cantidad' => $validated['cantidad'],
            'precio_unitario' => $validated['precio_unitario'],
            'precio_venta' => $validated['precio_venta'],
            'tallas' => $validated['tallas'] ?? null,
            'subtotal' => $subtotal,
        ]);

        return response()->json([
            'message' => 'Ítem agregado a la factura',
            'data' => $detalle->load('producto')
        ], 201);
    }

    public function destroy(Compra $compra, CompraDetalle $detalle)
    {
        if ($detalle->compra_id !== $compra->id) {
            abort(404);
        }
        
        $detalle->delete();
        
        return response()->json(['message' => 'Ítem eliminado correctamente']);
    }
}
