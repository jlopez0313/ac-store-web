<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProveedorResource extends JsonResource
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
            'cuenta_id'      => $this->cuenta_id,
            'nombre'         => $this->nombre,
            'tipo_documento' => $this->tipo_documento,
            'documento'      => $this->documento,
            'telefono'       => $this->telefono,
            'correo'         => $this->correo,
            'estado'         => (int) $this->estado,
            'cuenta'         => $this->whenLoaded('cuenta'),
            'created_at'     => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
