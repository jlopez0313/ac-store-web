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
            'detalle_original' => [
                'id' => $this->detalleOriginal->id,
                'producto' => [
                    'id' => $this->detalleOriginal->producto->id,
                    'codigo' => $this->detalleOriginal->producto->codigo,
                ],
                'talla' => $this->detalleOriginal->talla,
            ],
            'producto_nuevo' => [
                'id' => $this->productoNuevo->id,
                'codigo' => $this->productoNuevo->codigo,
            ],
            'talla_nueva' => $this->talla_nueva,
            'precio_original' => $this->precio_original,
            'precio_nuevo' => $this->precio_nuevo,
            'diferencia' => $this->diferencia,
            'status' => $this->status,
            'creado_por_name' => $this->creator ? $this->creator->name : 'N/A',
            'cuenta' => [
                'id' => $this->cuenta->id,
                'nombre' => $this->cuenta->nombre,
            ],
        ];
    }
}
