<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferenciaResource extends JsonResource
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
            'codigo' => $this->codigo,
            'descripcion' => $this->descripcion,
            'marca' => [
                'id' => $this->marca->id ?? null,
                'nombre' => $this->marca->nombre ?? 'Sin Marca',
            ],
            'total_stock' => $this->total_stock,
            'precio_venta' => $this->precio_venta,
            'impreso' => (bool)$this->impreso,
            'foto' => $this->foto ? asset('storage/' . $this->foto) : null,
            'categoria' => [
                'id' => $this->categoria->id ?? null,
                'nombre' => $this->categoria->nombre ?? '',
                'variaciones_json' => $this->categoria->variaciones_json ?? null,
            ],
            'cuenta' => $this->whenLoaded('cuenta'),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
