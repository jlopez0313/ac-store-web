<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'marca' => $this->marca,
            'descripcion' => $this->descripcion,
            'categoria_id' => $this->categoria_id,
            'cuenta_id' => $this->cuenta_id,
            // Prefix the photo path with the storage URL if it exists
            'foto' => $this->foto ? Storage::url($this->foto) : null,
            // Include relationships if loaded
            'categoria' => new CategoriaResource($this->whenLoaded('categoria')),
            'cuenta' => $this->whenLoaded('cuenta'), // Quick load, could make a Resource if needed
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
