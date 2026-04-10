<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MuestraResource extends JsonResource
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
            'local' => [
                'id' => $this->local->id,
                'name' => $this->local->name,
            ],
            'referencia' => [
                'id' => $this->referencia->id,
                'codigo' => $this->referencia->codigo,
                'descripcion' => $this->referencia->descripcion,
                'categoria' => $this->referencia->categoria ? $this->referencia->categoria->nombre : 'N/A',
            ],
            'variante' => $this->variante,
            'inventario_id' => $this->inventario_id,
            'etiquetas' => $this->etiquetas,
            'estado' => $this->estado,
            'bodega_original' => $this->inventario->estanteria->bodega->nombre ?? 'N/A',
            'estante_original' => $this->inventario->estanteria->nombre ?? 'N/A',
            'cuenta' => [
                'id' => $this->cuenta->id,
                'nombre' => $this->cuenta->nombre,
            ],
            'creado_por' => $this->creator ? $this->creator->name : 'N/A',
            'fecha' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
