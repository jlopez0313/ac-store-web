<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class VentaDetalleResource extends JsonResource
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
            'producto_id' => $this->producto_id,
            'producto' => [
                'id' => $this->producto->id ?? null,
                'codigo' => $this->producto->codigo ?? 'N/A',
                'descripcion' => $this->producto->descripcion ?? 'N/A',
                'marca' => $this->producto->marca->nombre ?? $this->producto->marca ?? 'N/A',
                'foto' => $this->producto->foto ? asset('storage/' . ltrim(str_replace('storage/', '', ltrim($this->producto->foto, '/')), '/')) : null,
            ],
            'bodega_id' => $this->bodega_id,
            'estanteria_id' => $this->estanteria_id,
            'bodega_nombre' => $this->bodega->nombre ?? ($this->estanteria->bodega->nombre ?? 'N/A'),
            'estanteria_nombre' => $this->estanteria->nombre ?? 'N/A',
            'talla' => $this->talla,
            'cantidad' => $this->cantidad,
            'precio_unitario' => (float)$this->precio_unitario,
            'subtotal' => (float)$this->subtotal,
            'impreso' => (bool)$this->impreso,
            'cambio' => $this->cambio ? [
                'observacion' => $this->cambio->observacion,
                'usuario' => $this->cambio->creator->name ?? 'Sistema',
                'nueva_venta_id' => $this->cambio->nueva_venta_id,
            ] : null,
        ];
    }
}
