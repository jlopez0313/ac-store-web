<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevolucionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'venta_id' => $this->venta_id,
            'inventario_id' => $this->inventario_id,
            'producto_id' => $this->producto_id,
            'bodega_id' => $this->bodega_id,
            'estanteria_id' => $this->estanteria_id,
            'talla' => $this->talla,
            'cantidad' => $this->cantidad,
            'precio_unitario' => $this->precio_unitario,
            'subtotal' => $this->subtotal,
            'observacion' => $this->observacion,
            'fecha_devolucion' => $this->deleted_at ?? $this->fecha_devolucion,
            'venta' => $this->whenLoaded('venta', function () {
                return [
                    'id' => $this->venta->id,
                    'numero' => $this->venta->numero,
                    'local' => $this->venta->local ? [
                        'id' => $this->venta->local->id,
                        'name' => $this->venta->local->name,
                    ] : null,
                    'cuenta' => $this->venta->cuenta ? [
                        'id' => $this->venta->cuenta->id,
                        'nombre' => $this->venta->cuenta->nombre,
                    ] : null,
                ];
            }),
            'producto' => $this->whenLoaded('producto', function () {
                return [
                    'id' => $this->producto->id,
                    'codigo' => $this->producto->codigo,
                    'descripcion' => $this->producto->descripcion,
                    'marca' => $this->producto->marca,
                    'foto' => $this->producto->foto ? asset('storage/' . ltrim(str_replace('storage/', '', ltrim($this->producto->foto, '/')), '/')) : null,
                ];
            }),
            'bodega' => $this->whenLoaded('bodega', function () {
                return [
                    'id' => $this->bodega->id,
                    'nombre' => $this->bodega->nombre,
                ];
            }),
            'estanteria' => $this->whenLoaded('estanteria', function () {
                return [
                    'id' => $this->estanteria->id,
                    'nombre' => $this->estanteria->nombre,
                ];
            }),
            'eliminador' => $this->whenLoaded('eliminador', function () {
                return [
                    'id' => $this->eliminador->id,
                    'name' => $this->eliminador->name,
                ];
            }, function() {
                return [
                    'id' => 0,
                    'name' => 'Sistema'
                ];
            }),
        ];
    }
}
