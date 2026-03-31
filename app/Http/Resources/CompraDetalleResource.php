<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompraDetalleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'compra_id'       => $this->compra_id,
            'referencia_id'   => $this->referencia_id,
            'bodega_id'       => $this->bodega_id,
            'estanteria_id'   => $this->estanteria_id,
            'modo'            => $this->modo,
            'numero_cajas'    => $this->numero_cajas,
            'pares_por_caja'  => $this->pares_por_caja,
            'cantidad'        => $this->cantidad,
            'precio_unitario' => $this->precio_unitario,
            'precio_venta'    => $this->precio_venta,
            'subtotal'        => $this->subtotal,
            'tallas'          => $this->tallas, // Assuming it's already an array from model cast
            'producto'        => $this->whenLoaded('producto'),
        ];
    }
}
