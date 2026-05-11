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
            'documento'  => $this->documento,
            'email'      => $this->email,
            'role'       => $this->role,
            'cuenta_id'  => $this->cuenta_id,
            'estado'     => $this->estado,
            'impresion_principal' => $this->impresion_principal,
            'nombre_impresora' => $this->nombre_impresora,
            'ciudad_id'  => $this->ciudad_id,
            'ciudad'     => $this->ciudad ? [
                'id' => $this->ciudad->id,
                'name' => $this->ciudad->name,
                'state_id' => $this->ciudad->state_id,
                'state' => $this->ciudad->state ? [
                    'id' => $this->ciudad->state->id,
                    'name' => $this->ciudad->state->name,
                    'country_id' => $this->ciudad->state->country_id,
                    'country' => $this->ciudad->state->country ? [
                        'id' => $this->ciudad->state->country->id,
                        'name' => $this->ciudad->state->country->name,
                    ] : null,
                ] : null,
            ] : null,
            'cuenta'     => [
                'id'     => $this->cuenta?->id,
                'nombre' => $this->cuenta?->nombre,
            ],
            'precio_suscripcion' => $this->precio_suscripcion,
            'maneja_vendedores' => (bool) $this->maneja_vendedores,
            'limite_sesiones' => $this->limite_sesiones,
            'fecha_vencimiento'  => $this->fecha_vencimiento?->toDateString(),
            'bodegas'    => $this->whenLoaded('bodegas', function () {
                return $this->bodegas->map(function ($bodega) {
                    return [
                        'id' => $bodega->id,
                        'nombre' => $bodega->nombre,
                    ];
                });
            }),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
