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
        $user->load('cuenta');
        $isSuper = $user->role === 'superadmin';

        $query = Cambio::with(['local', 'venta', 'detalleOriginal.producto', 'productoNuevo', 'cuenta', 'creator'])
            ->orderBy('created_at', 'desc');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        $locals = User::role('local')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'cuenta_id']);

        return Inertia::render('cambios/Index', [
            'lista' => CambioResource::collection($query->paginate($request->input('per_page', 25))->appends($request->all())),
            'filters' => $request->all(),
            'cuentas' => $isSuper ? Cuenta::all(['id', 'nombre', 'dias_cambio']) : [],
            'current_cuenta' => $user->cuenta ? ['id' => $user->cuenta->id, 'dias_cambio' => $user->cuenta->dias_cambio] : null,
            'locals' => $locals,
        ]);
    }

    public function searchSoldItems(Request $request)
    {
        $request->validate([
            'referencia' => 'required|string',
            'local_id' => 'nullable',
            'cuenta_id' => 'nullable|exists:cuentas,id',
        ]);

        $user = auth()->user();
        $cuentaId = $user->role === 'superadmin' ? $request->cuenta_id : $user->cuenta_id;

        // If superadmin and no account provided, try to find it from local_id
        if (!$cuentaId && $request->filled('local_id') && $request->local_id !== 'ALL') {
            $local = User::find($request->local_id);
            $cuentaId = $local?->cuenta_id;
        }

        if (!$cuentaId) {
            return response()->json(['error' => 'Debe seleccionar una cuenta o un local específico.'], 422);
        }

        $cuenta = Cuenta::find($cuentaId);
        $diasCambio = $cuenta ? $cuenta->dias_cambio : 15;

        $query = VentaDetalle::where('venta_detalles.estado', 'vendido')
            ->join('ventas', 'venta_detalles.venta_id', '=', 'ventas.id')
            ->where('ventas.estado', 'cerrada')
            ->where('ventas.cuenta_id', $cuentaId)
            ->where('ventas.fecha', '>=', now()->subDays($diasCambio)->format('Y-m-d'));
        
        if ($request->filled('local_id') && $request->local_id !== 'ALL') {
            $query->where('ventas.user_id', $request->local_id);
        }

        $query->whereHas('producto', function ($q) use ($request) {
                $q->where('codigo', 'like', "%{$request->referencia}%");
            })
            ->with(['producto.marca', 'venta.local'])
            ->orderBy('ventas.numero', 'desc')
            ->select('venta_detalles.*');

        $items = $query->get()->map(function ($det) {
            $fechaVenta = \Carbon\Carbon::parse($det->venta->fecha);
            return [
                'id' => $det->id,
                'venta_id' => $det->venta_id,
                'venta_numero' => $det->venta->numero ?? $det->venta_id,
                'fecha' => $fechaVenta->format('d/m/Y'),
                'dias' => $fechaVenta->diffInDays(now()),
                'talla' => $det->talla,
                'cantidad' => $det->cantidad,
                'precio' => $det->precio_unitario,
                'precio_sugerido' => $det->inventario->precio_venta ?? 0,
                'descuento' => \App\Models\BodegaAcceso::where('user_id', $det->venta->user_id)
                    ->where('bodega_id', $det->bodega_id)
                    ->first()?->descuento ?? 0,
                'producto_id' => $det->producto_id,
                'cliente' => $det->venta->cliente_nombre ?? 'N/A',
                'local' => $det->venta->local->name ?? 'N/A',
                'producto' => [
                    'codigo' => $det->producto->codigo,
                    'descripcion' => $det->producto->descripcion,
                    'marca' => $det->producto->marca->nombre ?? 'N/A',
                    'foto' => $det->producto->foto ? asset('storage/' . ltrim(str_replace('storage/', '', ltrim($det->producto->foto, '/')), '/')) : null,
                ]
            ];
        });

        return response()->json(['data' => $items]);
    }

    public function getClosedInvoices(Request $request)
    {
        $request->validate(['local_id' => 'required|exists:users,id']);

        $local = User::findOrFail($request->local_id);
        $cuenta = $local->cuenta ?? Cuenta::find($request->cuenta_id);
        $diasCambio = $cuenta ? $cuenta->dias_cambio : 15;

        $query = Venta::where('user_id', $request->local_id)
            ->where('estado', 'cerrada')
            ->where('fecha', '>=', now()->subDays($diasCambio)->format('Y-m-d'));

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
            'observacion' => 'required|string|min:5',
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
                if ($detalleOriginal->caja_id) {
                    $caja = \App\Models\Caja::find($detalleOriginal->caja_id);
                    if ($caja) {
                        $caja->increment('cantidad', $detalleOriginal->cantidad);
                    }
                } elseif ($detalleOriginal->inventario_id) {
                    $invOriginal = Inventario::find($detalleOriginal->inventario_id);
                    if ($invOriginal) {
                        $invOriginal->increment('stock', $detalleOriginal->cantidad);
                    }
                }

                // 2. Deduct new stock
                $nuevoInventario->decrement('stock', 1);

                // 3. Mark original as returned and ZERO OUT price in ORIGINAL invoice
                $detalleOriginal->update([
                    'estado' => 'devuelto_por_cambio',
                    'precio_unitario' => 0,
                    'subtotal' => 0
                ]);
                $detalleOriginal->venta->decrement('total', $precioOriginal);

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
                    'observacion' => $request->observacion,
                    'status' => 'completado',
                ]);

                // 5. Create a new Venta record for the replacement item
                $originalVenta = $detalleOriginal->venta;
                $cuentaId = $originalVenta->cuenta_id;
                $userId = $originalVenta->user_id;

                // Calculate next consecutive number for this account
                $nextNumero = (\App\Models\Venta::where('cuenta_id', $cuentaId)->max('numero') ?? 0) + 1;

                $nuevaVenta = \App\Models\Venta::create([
                    'numero'      => $nextNumero,
                    'user_id'     => $userId,
                    'cuenta_id'   => $cuentaId,
                    'fecha'       => now()->format('Y-m-d'),
                    'estado'      => 'cerrada',
                    'observaciones' => "Cambio de producto (Factura Original #{$detalleOriginal->venta_id}). Observación: " . $request->observacion,
                    'subtotal'    => $diferencia,
                    'total'       => $diferencia,
                ]);

                // Update Cambio with the new invoice ID
                $cambio->update(['nueva_venta_id' => $nuevaVenta->id]);

                // 5a. Positive line: The new item
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

                // 5b. Negative line: The credit (Saldo a favor)
                $nuevaVenta->detalles()->create([
                    'producto_id' => $detalleOriginal->producto_id,
                    'inventario_id' => $detalleOriginal->inventario_id,
                    'bodega_id' => $detalleOriginal->bodega_id,
                    'estanteria_id' => $detalleOriginal->estanteria_id,
                    'talla' => $detalleOriginal->talla,
                    'cantidad' => 1,
                    'precio_unitario' => -$precioOriginal,
                    'subtotal' => -$precioOriginal,
                    'estado' => 'cambio_saldo'
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
