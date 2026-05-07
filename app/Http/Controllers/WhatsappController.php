<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WhatsappController extends Controller
{
    public function index()
    {
        $cuentas = [];
        if (auth()->user()->role === 'superadmin') {
            $cuentas = Cuenta::orderBy('nombre')->get();
        }

        return Inertia::render('whatsapp/index', [
            'cuentas' => $cuentas
        ]);
    }
}
