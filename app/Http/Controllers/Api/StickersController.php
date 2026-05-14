<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EtiquetaPendiente;
use App\Models\Referencia;
use Illuminate\Http\Request;

class StickersController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
            'estanteria_id' => 'required|exists:estanterias,id',
            'tallas' => 'required|array',
            'tallas.*.talla' => 'required|string',
            'tallas.*.qty' => 'required|integer|min:1',
        ]);

        $referencia = Referencia::findOrFail($request->referencia_id);
        $cuenta_id = $referencia->cuenta_id;
        $sticker_ids = [];

        foreach ($request->tallas as $item) {
            for ($i = 0; $i < $item['qty']; $i++) {
                $sticker = EtiquetaPendiente::create([
                    'cuenta_id' => $cuenta_id,
                    'referencia_id' => $request->referencia_id,
                    'estanteria_id' => $request->estanteria_id,
                    'talla' => $item['talla'],
                    'cantidad' => 1,
                    'impreso' => false,
                ]);
                $sticker_ids[] = $sticker->id;
            }
        }

        return response()->json(['message' => 'Solicitud de etiquetas creada correctamente.']);
    }

    public function index(Request $request)
    {
        $query = EtiquetaPendiente::with(['referencia.marca', 'estanteria.bodega'])
            ->where('impreso', false);

        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        if ($request->has('ids')) {
            $query->whereIn('id', $request->ids);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function markAsPrinted(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|exists:etiquetas_pendientes,id',
        ]);

        EtiquetaPendiente::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => 'Etiquetas eliminadas correctamente.']);
    }
}
