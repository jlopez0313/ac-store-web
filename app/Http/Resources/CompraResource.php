<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompraResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'numero'         => $this->numero,
            'cuenta_id'      => $this->cuenta_id,
            'proveedor_id'   => $this->proveedor_id,
            'estado'         => $this->estado,
            'fecha_apertura' => $this->fecha_apertura ? $this->fecha_apertura->format('Y-m-d\TH:i:s') : null,
            'fecha_cierre'   => $this->fecha_cierre ? $this->fecha_cierre->format('Y-m-d\TH:i:s') : null,
            'observaciones'  => $this->observaciones,
            'flete'          => $this->flete,
            'cuenta'         => $this->whenLoaded('cuenta'),
            'proveedor'      => clone $this->whenLoaded('proveedor'),
            'detalles'       => CompraDetalleResource::collection($this->whenLoaded('detalles')),
            'created_at'     => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
