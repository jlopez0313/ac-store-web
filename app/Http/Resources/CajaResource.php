<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CajaResource extends JsonResource
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
            'referencia_foto' => $this->referencia->foto ?? '',
            'referencia_marca' => $this->referencia->marca->nombre ?? '',
            'bodega_id' => $this->bodega_id,
            'bodega_nombre' => $this->bodega->nombre ?? '',
            'compra_id' => $this->compra_id,
            'compra_fecha' => $this->compra->fecha_apertura ? $this->compra->fecha_apertura->format('Y-m-d') : '',
            'pares_por_caja' => $this->pares_por_caja,
            'cantidad' => $this->cantidad,
            'precio_compra' => $this->precio_compra,
            'precio_venta' => $this->precio_venta,
            'referencia_variaciones' => $this->referencia->categoria->variaciones_json ?? [],
        ];
    }
}
