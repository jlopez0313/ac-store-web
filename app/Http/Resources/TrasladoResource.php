<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrasladoResource extends JsonResource
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
            'talla' => $this->talla,
            'bodega_origen' => $this->bodegaOrigen->nombre ?? '',
            'estanteria_origen' => $this->estanteriaOrigen->nombre ?? '',
            'bodega_destino' => $this->bodegaDestino->nombre ?? '',
            'estanteria_destino' => $this->estanteriaDestino->nombre ?? '',
            'cantidad' => $this->cantidad,
            'usuario_nombre' => $this->usuario->name ?? '',
            'fecha' => $this->created_at->format('Y-m-d H:i'),
        ];
    }
}
