<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventarioResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = auth()->user();
        $descuento = 0;
        if ($user && $user->role === 'local') {
            $acceso = \App\Models\BodegaAcceso::where('user_id', $user->id)
                ->where('bodega_id', $this->estanteria->bodega_id)
                ->first();
            $descuento = $acceso ? (int) $acceso->descuento : 0;
        }

        return [
            'id' => $this->id,
            'referencia_id' => $this->referencia_id,
            'referencia_codigo' => $this->referencia->codigo ?? '',
            'referencia_descripcion' => $this->referencia->descripcion ?? '',
            'referencia_marca' => $this->referencia->marca ?? '',
            'estanteria_id' => $this->estanteria_id,
            'estanteria_nombre' => $this->estanteria->nombre ?? '',
            'bodega_id' => $this->estanteria->bodega_id ?? null,
            'bodega_nombre' => $this->estanteria->bodega->nombre ?? '',
            'talla' => $this->talla,
            'stock' => $this->stock,
            'precio_compra' => $this->precio_compra,
            'precio_venta' => $this->precio_venta,
            'descuento' => $descuento,
            'precio_ajustado' => max(0, $this->precio_venta - $descuento),
        ];
    }
}
