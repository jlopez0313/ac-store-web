<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VentaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $bodega = $this->detalles->first()?->bodega;

        if (!$bodega && $this->local) {
            $acceso = \App\Models\BodegaAcceso::where('user_id', $this->user_id)->first();
            $bodega = $acceso ? $acceso->bodega : null;
        }

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'local' => new UserResource($this->local),
            'bodega' => $bodega ? [
                'id' => $bodega->id,
                'nombre' => $bodega->nombre,
            ] : null,
            'fecha' => $this->fecha,
            'created_at' => $this->created_at->toISOString(),
            'estado' => $this->estado,
            'items_count' => (int) ($this->total_items ?? $this->detalles->sum('cantidad')),
            'total' => $this->total,
            'subtotal' => $this->subtotal,
            'observaciones' => $this->observaciones,
            'observaciones_local' => $this->observaciones_local,
            'cuenta_id' => $this->cuenta_id,
            'cuenta' => [
                'id' => $this->cuenta_id,
                'nombre' => $this->cuenta->nombre ?? 'N/A',
                'dias_cambio' => $this->cuenta->dias_cambio ?? 15,
            ],
            'vendedor' => $this->vendedor ? $this->vendedor->nombre : ($this->creator ? $this->creator->name : ($this->local->name ?? 'N/A')),
            'detalles' => $this->detalles ? $this->detalles->map(function ($d) {
                return [
                    'id' => $d->id,
                    'producto_id' => $d->producto_id,
                    'producto' => [
                        'id' => $d->producto->id ?? null,
                        'codigo' => $d->producto->codigo ?? 'N/A',
                        'descripcion' => $d->producto->descripcion ?? 'N/A',
                        'marca' => $d->producto->marca->nombre ?? $d->producto->marca ?? 'N/A',
                        'foto' => $d->producto->foto ? asset('storage/' . ltrim(str_replace('storage/', '', ltrim($d->producto->foto, '/')), '/')) : null,
                    ],
                    'bodega_id' => $d->bodega_id,
                    'estanteria_id' => $d->estanteria_id,
                    'estanteria_nombre' => $d->estanteria->nombre ?? 'N/A',
                    'bodega_nombre' => $d->estanteria->bodega->nombre ?? 'N/A',
                    'talla' => $d->talla,
                    'cantidad' => $d->cantidad,
                    'precio_unitario' => $d->precio_unitario,
                    'subtotal' => $d->subtotal,
                    'estado' => $d->estado,
                    'observacion' => $d->observacion,
                    'impreso' => (bool) $d->impreso,
                    'precio_sugerido' => $d->inventario->precio_venta ?? 0,
                    'descuento_bodega' => \App\Models\BodegaAcceso::where('user_id', $this->user_id)
                        ->where('bodega_id', $d->bodega_id)
                        ->first()?->descuento ?? 0,
                    'cambio' => $d->cambio ? [
                        'observacion' => $d->cambio->observacion,
                        'usuario' => $d->cambio->creator->name ?? 'Sistema',
                        'nueva_venta_id' => $d->cambio->nueva_venta_id,
                    ] : (\App\Models\Cambio::where('nueva_venta_id', $this->id)
                            ->where('nuevo_inventario_id', $d->inventario_id)
                            ->first() ? [
                            'es_nuevo' => true,
                            'observacion' => \App\Models\Cambio::where('nueva_venta_id', $this->id)
                                ->where('nuevo_inventario_id', $d->inventario_id)
                                ->first()->observacion,
                            'factura_original' => \App\Models\Cambio::where('nueva_venta_id', $this->id)
                                ->where('nuevo_inventario_id', $d->inventario_id)
                                ->first()->venta->numero ?? 'N/A',
                        ] : null),
                ];
            }) : [],
            'has_devoluciones' => \App\Models\Devolucion::where('venta_id', $this->id)->exists() ||
                \App\Models\VentaDetalle::where('venta_id', $this->id)->onlyTrashed()->exists(),
            'devoluciones_detalle' => \App\Models\VentaDetalle::onlyTrashed()
                ->where('venta_id', $this->id)
                ->with(['producto', 'eliminador'])
                ->get()
                ->map(function ($d) {
                    return [
                        'id' => $d->id,
                        'producto' => $d->producto->codigo ?? 'N/A',
                        'descripcion' => $d->producto->descripcion ?? 'N/A',
                        'talla' => $d->talla,
                        'cantidad' => $d->cantidad,
                        'motivo' => $d->observacion,
                        'fecha' => $d->deleted_at ? $d->deleted_at->format('Y-m-d H:i') : 'N/A',
                        'usuario' => $d->eliminador->name ?? 'Sistema',
                    ];
                }),
            'info_cambio' => \App\Models\Cambio::where('nueva_venta_id', $this->id)->first() ? [
                'observacion' => \App\Models\Cambio::where('nueva_venta_id', $this->id)->first()->observacion,
                'factura_original' => \App\Models\Cambio::where('nueva_venta_id', $this->id)->first()->venta->numero ?? \App\Models\Cambio::where('nueva_venta_id', $this->id)->first()->venta_id,
            ] : null,
        ];
    }
}
