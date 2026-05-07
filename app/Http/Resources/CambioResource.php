<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CambioResource extends JsonResource
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
            'fecha' => $this->created_at->format('Y-m-d H:i:s'),
            'local' => [
                'id' => $this->local->id,
                'name' => $this->local->name,
            ],
            'venta_id' => $this->venta_id,
            'nueva_venta_id' => $this->nueva_venta_id,
            'detalle_original' => [
                'id' => $this->detalleOriginal->id,
                'producto' => [
                    'id' => $this->detalleOriginal->producto->id,
                    'codigo' => $this->detalleOriginal->producto->codigo,
                    'descripcion' => $this->detalleOriginal->producto->descripcion,
                    'marca' => $this->detalleOriginal->producto->marca,
                ],
                'talla' => $this->detalleOriginal->talla,
                'bodega_nombre' => $this->detalleOriginal->bodega->nombre ?? ($this->detalleOriginal->estanteria->bodega->nombre ?? 'N/A'),
                'estanteria_nombre' => $this->detalleOriginal->estanteria->nombre ?? 'N/A',
            ],
            'producto_nuevo' => [
                'id' => $this->productoNuevo->id,
                'codigo' => $this->productoNuevo->codigo,
                'descripcion' => $this->productoNuevo->descripcion,
                'marca' => $this->productoNuevo->marca,
            ],
            'nuevo_item_bodega' => $this->nuevoInventario->bodega->nombre ?? ($this->nuevoInventario->estanteria->bodega->nombre ?? 'N/A'),
            'nuevo_item_estanteria' => $this->nuevoInventario->estanteria->nombre ?? 'N/A',
            'talla_nueva' => $this->talla_nueva,
            'precio_original' => $this->precio_original,
            'precio_nuevo' => $this->precio_nuevo,
            'diferencia' => $this->diferencia,
            'observacion' => $this->observacion,
            'status' => $this->status,
            'creado_por_name' => $this->creator ? $this->creator->name : 'N/A',
            'cuenta' => [
                'id' => $this->cuenta->id,
                'nombre' => $this->cuenta->nombre,
            ],
        ];
    }
}
