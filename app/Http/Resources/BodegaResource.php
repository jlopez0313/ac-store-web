<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BodegaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'nombre'     => $this->nombre,
            'direccion'  => $this->direccion,
            'estado'     => $this->estado,
            'cuenta_id'  => $this->cuenta_id,
            'cuenta'     => [
                'id'     => $this->cuenta?->id,
                'nombre' => $this->cuenta?->nombre,
            ],
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
