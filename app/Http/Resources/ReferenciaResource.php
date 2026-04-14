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
            'foto' => $this->foto ? asset('storage/' . $this->foto) : null,
            'categoria' => [
                'id' => $this->categoria->id ?? null,
                'nombre' => $this->categoria->nombre ?? '',
            ],
        ];
    }
}
