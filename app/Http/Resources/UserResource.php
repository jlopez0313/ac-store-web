<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name'       => $this->name,
            'username'   => $this->username,
            'email'      => $this->email,
            'role'       => $this->role,
            'cuenta_id'  => $this->cuenta_id,
            'estado'     => $this->estado,
            'cuenta'     => [
                'id'     => $this->cuenta?->id,
                'nombre' => $this->cuenta?->nombre,
            ],
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
