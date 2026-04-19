<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referencia;
use App\Models\Inventario;
use App\Http\Resources\ReferenciaResource;
use App\Http\Resources\InventarioResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class InventariosController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $sortField = $request->input('sort_field', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Referencia::with(['categoria', 'marca'])
            ->withSum(['inventarios as total_stock' => function ($q) use ($user, $isSuper) {
                if (!$isSuper) {
                    $q->where('cuenta_id', $user->cuenta_id);
                }
            }], 'stock')
            ->withMax(['inventarios as precio_venta' => function ($q) use ($user, $isSuper) {
                if (!$isSuper) {
                    $q->where('cuenta_id', $user->cuenta_id);
                }
            }], 'precio_venta');

        if ($sortField === 'marca') {
            $query->join('marcas', 'referencias.marca_id', '=', 'marcas.id')
                ->select('referencias.*')
                ->orderBy('marcas.nombre', $sortOrder);
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        if (!$isSuper) {
            $query->where('referencias.cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('referencias.cuenta_id', $request->input('cuenta_id'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%")
                  ->orWhereHas('marca', function ($mq) use ($search) {
                      $mq->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        $paginated = $query->paginate($request->input('per_page', 25));

        return ReferenciaResource::collection($paginated);
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

    public function exportCsv(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->hasRole('superadmin');

        $cuentaId = $isSuper && $request->filled('cuenta_id')
            ? $request->input('cuenta_id')
            : $user->cuenta_id;

        $query = Inventario::with(['referencia.marca', 'estanteria.bodega'])
            ->where('stock', '>', 0);

        if ($cuentaId) {
            $query->where('cuenta_id', $cuentaId);
        } elseif (!$isSuper) {
            return response()->json(['message' => 'Debe seleccionar una cuenta.'], 422);
        }

        $items = $query->get();

        $csv = "Marca;Descripcion;Talla;CodigoBarras;Bodega;Estanteria\n";

        foreach ($items as $item) {
            $ref = $item->referencia;
            if (!$ref) continue;

            $marca = str_replace('"', '""', $ref->marca?->nombre ?: 'N/A');
            $descripcion = str_replace('"', '""', $ref->descripcion ?: '');
            $talla = $item->talla;
            $codigo = $ref->codigo;
            $bodega = str_replace('"', '""', $item->estanteria?->bodega?->nombre ?: '');
            $estanteria = str_replace('"', '""', $item->estanteria?->nombre ?: '');

            $barcodeContent = $ref->sistema_viejo ? $codigo : "{$codigo}-{$talla}";

            $csv .= "\"{$marca}\";\"{$descripcion}\";\"{$talla}\";\"{$barcodeContent}\";\"{$bodega}\";\"{$estanteria}\"\n";
        }

        $filename = "etiquetas_inventario.csv";

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
    }

    public function downloadLabel($id)
    {
        $user = auth()->user();
        \Log::info("Download attempt for ID: {$id} | User: " . ($user?->id ?? 'GUEST') . " | Cuenta: " . ($user?->cuenta_id ?? 'NONE'));

        $item = Inventario::with(['referencia.marca', 'estanteria.bodega'])
            ->findOrFail($id);

        $ref = $item->referencia;
        $marca = $ref->marca?->nombre ?: 'N/A';
        $descripcion = $ref->descripcion;
        $talla = $item->talla;
        $codigo = $ref->codigo;
        $bodega = $item->estanteria->bodega->nombre;
        $estanteria = $item->estanteria->nombre;

        // Lógica de código de barras
        $barcodeContent = $ref->sistema_viejo ? $codigo : "{$codigo}-{$talla}";

        // Generar CSV para NiceLabel Pro
        // El usuario debe tener una plantilla .lbl en NiceLabel con los campos:
        // Marca, Descripcion, Talla, CodigoBarras, Bodega, Estanteria
        $csv = "Marca;Descripcion;Talla;CodigoBarras;Bodega;Estanteria\n";
        $csv .= "\"{$marca}\";\"{$descripcion}\";\"{$talla}\";\"{$barcodeContent}\";\"{$bodega}\";\"{$estanteria}\"\n";

        $filename = "etiqueta_{$barcodeContent}.csv";

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"; filename*=UTF-8''" . rawurlencode($filename),
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
    }
}
