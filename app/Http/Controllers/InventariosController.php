<?php

namespace App\Http\Controllers;

use App\Http\Resources\InventarioResource;
use App\Models\Inventario;
use App\Models\Referencia;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventariosController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $bodegasQuery = \App\Models\Bodega::where('estado', 1)
            ->with('estanterias')
            ->orderBy('nombre');

        if (!$user->hasRole('superadmin')) {
            $bodegasQuery->where('cuenta_id', $user->cuenta_id);
        }

        $bodegas = $bodegasQuery->get();

        return Inertia::render('inventario/Index', [
            'filters' => $request->only(['search', 'per_page', 'sort_field', 'sort_order']),
            'bodegas' => $bodegas,
        ]);
    }

    public function detail(Referencia $referencia)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Inventario::where('referencia_id', $referencia->id)
            ->with(['estanteria.bodega'])
            ->orderBy('stock', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        return response()->json([
            'data' => InventarioResource::collection($query->get())
        ]);
    }

    public function ajustar(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['superadmin', 'admin', 'bodega'])) {
            return response()->json(['error' => 'No tiene permisos para realizar ajustes de inventario.'], 403);
        }

        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
            'estanteria_id' => 'required|exists:estanterias,id',
            'nueva_estanteria_id' => 'nullable|exists:estanterias,id',
            'precio_compra' => 'required|integer|min:0',
            'precio_venta' => 'required|integer|min:0',
            'observacion' => 'nullable|string',
            'detalles' => 'required|array',
            'detalles.*.talla' => 'required|string',
            'detalles.*.stock' => 'required|integer|min:0',
        ]);

        return \DB::transaction(function () use ($request) {
            $user = auth()->user();
            $referenciaId = $request->referencia_id;
            $estanteriaId = $request->estanteria_id;
            $nuevaEstanteriaId = $request->input('nueva_estanteria_id', $estanteriaId);

            // If location changed, we should ideally move the existing records or merge them.
            // For simplicity in "adjustment", we will use the nuevaEstanteriaId as the target.
            
            $targetEstanteriaId = $nuevaEstanteriaId;

            // 1. Snapshot old global prices (from original shelf)
            $firstRecord = Inventario::where('referencia_id', $referenciaId)
                ->where('estanteria_id', $estanteriaId)
                ->first();

            $precioCompraAnterior = $firstRecord ? $firstRecord->precio_compra : 0;
            $precioVentaAnterior = $firstRecord ? $firstRecord->precio_venta : 0;

            // 2. If we are moving to a new shelf, we might want to clear the old one for these sizes
            // but the 'detalles' sent are for the target state. 
            // If estanteriaId != targetEstanteriaId, it means a relocation.
            if ($estanteriaId != $targetEstanteriaId) {
                // Set old records to 0 stock for this reference/shelf
                Inventario::where('referencia_id', $referenciaId)
                    ->where('estanteria_id', $estanteriaId)
                    ->update(['stock' => 0]);
            }

            // 3. Update global prices for the TARGET shelf
            Inventario::where('referencia_id', $referenciaId)
                ->where('estanteria_id', $targetEstanteriaId)
                ->update([
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
                ]);

            // 4. Process stock adjustments in the TARGET shelf
            $detalleStockLog = [];
            foreach ($request->detalles as $det) {
                $inv = Inventario::firstOrNew([
                    'referencia_id' => $referenciaId,
                    'estanteria_id' => $targetEstanteriaId,
                    'talla' => $det['talla'],
                ]);

                if (!$inv->exists) {
                    $ref = Referencia::find($referenciaId);
                    $inv->cuenta_id = $ref->cuenta_id;
                }

                $stockAnterior = $inv->stock ?? 0;
                $inv->stock = $det['stock'];
                $inv->precio_compra = $request->precio_compra;
                $inv->precio_venta = $request->precio_venta;
                $inv->save();

                $detalleStockLog[] = [
                    'talla' => $det['talla'],
                    'anterior' => $stockAnterior,
                    'nuevo' => $det['stock'],
                ];
            }

            // 6. Sync base price in Referencia table
            Referencia::where('id', $referenciaId)->update([
                'precio_compra' => $request->precio_compra,
                'precio_venta' => $request->precio_venta,
            ]);

            // 5. Create Audit Log
            \App\Models\AjusteInventario::create([
                'referencia_id' => $referenciaId,
                'estanteria_id' => $targetEstanteriaId,
                'precio_compra_anterior' => $precioCompraAnterior,
                'precio_compra_nuevo' => $request->precio_compra,
                'precio_venta_anterior' => $precioVentaAnterior,
                'precio_venta_nuevo' => $request->precio_venta,
                'detalle_stock' => $detalleStockLog,
                'observacion' => $request->observacion . ($estanteriaId != $targetEstanteriaId ? " (Reubicado desde estante ID {$estanteriaId})" : ""),
            ]);

            return response()->json(['message' => 'Inventario ajustado correctamente']);
        });
    }
}
