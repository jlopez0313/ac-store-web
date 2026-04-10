<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventarioResource extends JsonResource
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
            'referencia_id' => $this->referencia_id,
            'referencia_codigo' => $this->referencia->codigo ?? '',
            'referencia_descripcion' => $this->referencia->descripcion ?? '',
            'referencia_marca' => $this->referencia->marca ?? '',
            'estanteria_id' => $this->estanteria_id,
            'estanteria_nombre' => $this->estanteria->nombre ?? '',
            'bodega_id' => $this->estanteria->bodega_id ?? null,
            'bodega_nombre' => $this->estanteria->bodega->nombre ?? '',
            'talla' => $this->talla,
            'stock' => $this->stock,
            'precio_compra' => $this->precio_compra,
            'precio_venta' => $this->precio_venta,
        ];
    }
}
