<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\CompraDetalle;
use App\Models\Inventario;
use App\Models\Caja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $detalle = DB::transaction(function () use ($compra, $validated, $subtotal) {
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

            if ($detalle->modo === 'tallado' && !empty($detalle->tallas)) {
                $cuenta_id = auth()->user()->cuenta_id ?? $compra->cuenta_id;
                foreach ($detalle->tallas as $tallaData) {
                    $inventario = Inventario::updateOrCreate(
                        [
                            'cuenta_id' => $cuenta_id,
                            'referencia_id' => $detalle->referencia_id,
                            'estanteria_id' => $tallaData['estanteria_id'],
                            'talla' => $tallaData['size'],
                        ],
                        [
                            'precio_compra' => $detalle->precio_unitario,
                            'precio_venta' => $detalle->precio_venta,
                        ]
                    );
                    $inventario->increment('stock', $tallaData['qty']);
                }
            }

            if ($detalle->modo === 'cajas') {
                $cuenta_id = auth()->user()->cuenta_id ?? $compra->cuenta_id;
                Caja::create([
                    'cuenta_id' => $cuenta_id,
                    'referencia_id' => $detalle->referencia_id,
                    'bodega_id' => $detalle->bodega_id,
                    'compra_id' => $compra->id,
                    'compra_detalle_id' => $detalle->id,
                    'pares_por_caja' => $detalle->pares_por_caja,
                    'cantidad' => $detalle->cantidad,
                    'precio_compra' => $detalle->precio_unitario,
                    'precio_venta' => $detalle->precio_venta,
                ]);
            }

            return $detalle;
        });

        return response()->json([
            'message' => 'Ítem agregado a la factura',
            'data' => $detalle->load('producto')
        ], 201);
    }

    public function destroy(Compra $compra, CompraDetalle $detalle)
    {
        DB::transaction(function () use ($compra, $detalle) {
            if ($detalle->modo === 'tallado' && !empty($detalle->tallas)) {
                $cuenta_id = auth()->user()->cuenta_id ?? $compra->cuenta_id;
                foreach ($detalle->tallas as $tallaData) {
                    $inventario = Inventario::where([
                        'cuenta_id' => $cuenta_id,
                        'referencia_id' => $detalle->referencia_id,
                        'estanteria_id' => $tallaData['estanteria_id'],
                        'talla' => $tallaData['size'],
                    ])->first();

                    if ($inventario) {
                        $inventario->decrement('stock', $tallaData['qty']);
                    }
                }
            }

            if ($detalle->modo === 'cajas') {
                Caja::where('compra_detalle_id', $detalle->id)->delete();
            }

            $detalle->delete();
        });
        
        return response()->json(['message' => 'Ítem eliminado correctamente']);
    }
}
