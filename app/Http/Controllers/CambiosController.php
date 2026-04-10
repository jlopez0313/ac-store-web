<?php

namespace App\Http\Controllers;

use App\Models\Cambio;
use App\Models\Cuenta;
use App\Models\Inventario;
use App\Models\Venta;
use App\Models\VentaDetalle;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Resources\CambioResource;

class CambiosController extends Controller
{
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

        $locals = User::role('local')
            ->get(['id', 'name', 'cuenta_id']);

        return Inertia::render('cambios/Index', [
            'lista' => CambioResource::collection($query->paginate($request->input('per_page', 25))->appends($request->all())),
            'filters' => $request->all(),
            'cuentas' => $isSuper ? Cuenta::all(['id', 'nombre']) : [],
            'locals' => $locals,
        ]);
    }

    public function getClosedInvoices(Request $request)
    {
        $request->validate(['local_id' => 'required|exists:users,id']);

        $query = Venta::where('user_id', $request->local_id)
            ->where('estado', 'cerrada');

        if ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('codigo')) {
            $query->whereHas('detalles.producto', function ($q) use ($request) {
                $q->where('codigo', 'like', "%{$request->codigo}%");
            });
        }

        $invoices = $query->orderBy('id', 'desc')
            ->get(['id', 'fecha', 'total']);

        return response()->json(['data' => $invoices]);
    }

    public function getInvoiceDetails(Request $request)
    {
        $request->validate(['venta_id' => 'required|exists:ventas,id']);

        $details = VentaDetalle::where('venta_id', $request->venta_id)
            ->where('estado', 'vendido')
            ->with(['producto'])
            ->get();

        return response()->json(['data' => $details]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'venta_id' => 'required|exists:ventas,id',
            'venta_detalle_id' => 'required|exists:venta_detalles,id',
            'nuevo_inventario_id' => 'required|exists:inventarios,id',
            'precio_nuevo' => 'required|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $detalleOriginal = VentaDetalle::findOrFail($request->venta_detalle_id);
                $nuevoInventario = Inventario::with('estanteria.bodega')->findOrFail($request->nuevo_inventario_id);
                
                $precioOriginal = $detalleOriginal->precio_unitario;
                $precioNuevo = $request->precio_nuevo;
                $diferencia = $precioNuevo - $precioOriginal;

                if ($diferencia < 0) {
                    throw new \Exception("El nuevo producto debe ser de igual o mayor valor.");
                }

                if ($nuevoInventario->stock <= 0) {
                    throw new \Exception("No hay stock disponible del nuevo producto.");
                }

                // 1. Restore original stock
                $invOriginal = Inventario::find($detalleOriginal->inventario_id);
                if ($invOriginal) {
                    $invOriginal->increment('stock', 1);
                }

                // 2. Deduct new stock
                $nuevoInventario->decrement('stock', 1);

                // 3. Mark original as returned
                $detalleOriginal->update(['estado' => 'devuelto_por_cambio']);

                // 4. Create Cambio record
                $cambio = Cambio::create([
                    'cuenta_id' => $detalleOriginal->venta->cuenta_id,
                    'local_id' => $detalleOriginal->venta->user_id,
                    'venta_id' => $detalleOriginal->venta_id,
                    'venta_detalle_id' => $detalleOriginal->id,
                    'nuevo_producto_id' => $nuevoInventario->referencia_id,
                    'nuevo_inventario_id' => $nuevoInventario->id,
                    'talla_nueva' => $nuevoInventario->talla,
                    'precio_original' => $precioOriginal,
                    'precio_nuevo' => $precioNuevo,
                    'diferencia' => $diferencia,
                    'status' => 'completado',
                ]);

                // 5. Create a new Venta record for the replacement item
                // This ensures it goes to "the invoice" with the final value
                $nuevaVenta = Venta::create([
                    'user_id' => $detalleOriginal->venta->user_id,
                    'cuenta_id' => $detalleOriginal->venta->cuenta_id,
                    'fecha' => now()->format('Y-m-d'),
                    'estado' => 'cerrada',
                    'observaciones' => "Cambio de producto (Factura Original #{$detalleOriginal->venta_id})",
                    'total' => $precioNuevo,
                ]);

                $nuevaVenta->detalles()->create([
                    'producto_id' => $nuevoInventario->referencia_id,
                    'inventario_id' => $nuevoInventario->id,
                    'bodega_id' => $nuevoInventario->estanteria->bodega_id,
                    'estanteria_id' => $nuevoInventario->estanteria_id,
                    'talla' => $nuevoInventario->talla,
                    'cantidad' => 1,
                    'precio_unitario' => $precioNuevo,
                    'subtotal' => $precioNuevo,
                ]);

                return response()->json([
                    'message' => 'Cambio procesado correctamente.',
                    'data' => $cambio
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
