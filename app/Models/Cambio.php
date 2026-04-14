<?php

namespace App\Models;

use App\Traits\Blameable;
use Illuminate\Database\Eloquent\Model;

class Cambio extends Model
{
    use Blameable;

    protected $fillable = [
        'cuenta_id',
        'local_id',
        'venta_id',
        'venta_detalle_id',
        'nuevo_producto_id',
        'nuevo_inventario_id',
        'talla_nueva',
        'precio_original',
        'precio_nuevo',
        'diferencia',
        'observacion',
        'nueva_venta_id',
        'status',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function nuevaVenta()
    {
        return $this->belongsTo(Venta::class, 'nueva_venta_id');
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function local()
    {
        return $this->belongsTo(User::class, 'local_id');
    }

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function detalleOriginal()
    {
        return $this->belongsTo(VentaDetalle::class, 'venta_detalle_id');
    }

    public function productoNuevo()
    {
        return $this->belongsTo(Referencia::class, 'nuevo_producto_id');
    }

    public function inventarioNuevo()
    {
        return $this->belongsTo(Inventario::class, 'nuevo_inventario_id');
    }
}
