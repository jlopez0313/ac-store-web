<?php

namespace App\Http\Controllers;

use App\Http\Resources\MuestraResource;
use App\Models\Cuenta;
use App\Models\Muestra;
use App\Models\Referencia;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Inventario;
use Inertia\Inertia;

class MuestrasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Muestra::with(['local', 'referencia.categoria', 'cuenta', 'creator', 'inventario.estanteria.bodega'])
            ->orderBy('created_at', 'desc');

        // Role-based filtering
        if ($user->role !== 'superadmin') {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('local_id')) {
            $query->where('local_id', $request->local_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referencia', function ($rq) use ($search) {
                    $rq->where('codigo', 'like', "%$search%")
                        ->orWhere('descripcion', 'like', "%$search%");
                });
            });
        }

        return Inertia::render('muestras/Index', [
            'lista' => MuestraResource::collection($query->paginate($request->input('per_page', 25))->appends($request->all())),
            'cuentas' => $user->role === 'superadmin' ? Cuenta::where('estado', true)->get(['id', 'nombre']) : [],
            'locals' => User::role('local')->orderBy('name', 'asc')->get(['id', 'name']),
            'filters' => $request->all(),
        ]);
    }

    public function getReferencesByAccount(Request $request)
    {
        $cuenta_id = $request->cuenta_id;
        if (!$cuenta_id) return response()->json([]);

        $references = Referencia::where('cuenta_id', $cuenta_id)
            ->with(['categoria'])
            ->get(['id', 'codigo', 'descripcion', 'categoria_id', 'foto']);

        return response()->json($references);
    }

    public function getStock(Request $request)
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
        ]);

        $stock = Inventario::where('referencia_id', $request->referencia_id)
            ->with(['referencia', 'estanteria.bodega'])
            ->get()
            ->filter(function ($item) {
                $hasSubdiv = !empty($item->subdivision_stock) && collect($item->subdivision_stock)->sum() > 0;
                return $item->stock > 0 || $hasSubdiv;
            })
            ->values()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'bodega_id' => $item->estanteria->bodega->id,
                    'bodega_nombre' => $item->estanteria->bodega->nombre,
                    'estanteria_nombre' => $item->estanteria->nombre,
                    'talla' => $item->talla,
                    'stock' => $item->stock,
                    'precio_venta' => $item->precio_venta,
                    'subdivision_stock' => $item->subdivision_stock,
                    'referencia_foto' => $item->referencia->foto,
                ];
            });

        return response()->json(['data' => $stock]);
    }

    public function show(Muestra $muestras_crud)
    {
        return new MuestraResource($muestras_crud->load(['local', 'referencia.categoria', 'cuenta', 'inventario.estanteria.bodega']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'local_id' => 'required|exists:users,id',
            'referencia_id' => 'required|exists:referencias,id',
            'inventario_id' => 'required|exists:inventarios,id',
            'variante' => 'required|string',
            'etiquetas' => 'required|array|min:1',
            'cuenta_id' => 'required|exists:cuentas,id',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $inventario = Inventario::with('referencia.categoria')->findOrFail($validated['inventario_id']);
                
                $this->updateInventoryForMuestra($inventario, $validated['etiquetas'], 'subtract');

                $muestra = Muestra::create($validated);
                
                // Mark OTHER samples as already printed (true) so ONLY the new one stays pending (false)
                Muestra::where('cuenta_id', $validated['cuenta_id'])
                    ->where('id', '!=', $muestra->id)
                    ->update(['impreso' => true]);

                return response()->json([
                    'message' => 'Muestra registrada correctamente',
                    'muestra' => new MuestraResource($muestra)
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function update(Request $request, Muestra $muestras_crud)
    {
        if ($muestras_crud->estado === 'vendido') {
            return response()->json(['error' => 'No se puede editar una muestra que ya ha sido vendida.'], 422);
        }

        $validated = $request->validate([
            'local_id' => 'required|exists:users,id',
            'referencia_id' => 'required|exists:referencias,id',
            'inventario_id' => 'required|exists:inventarios,id',
            'variante' => 'required|string',
            'etiquetas' => 'required|array|min:1',
            'cuenta_id' => 'required|exists:cuentas,id',
        ]);

        try {
            return DB::transaction(function () use ($validated, $muestras_crud) {
                // Restore old inventory state
                $oldInv = Inventario::with('referencia.categoria')->findOrFail($muestras_crud->inventario_id);
                $this->updateInventoryForMuestra($oldInv, $muestras_crud->etiquetas, 'add');

                // Apply new inventory state
                $newInv = Inventario::with('referencia.categoria')->findOrFail($validated['inventario_id']);
                $this->updateInventoryForMuestra($newInv, $validated['etiquetas'], 'subtract');

                $muestras_crud->update($validated);

                return response()->json([
                    'message' => 'Muestra actualizada correctamente',
                    'muestra' => new MuestraResource($muestras_crud)
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function destroy(Muestra $muestras_crud)
    {
        try {
            DB::transaction(function () use ($muestras_crud) {
                if ($muestras_crud->estado !== 'vendido') {
                    $inventario = Inventario::with('referencia.categoria')->findOrFail($muestras_crud->inventario_id);
                    $this->updateInventoryForMuestra($inventario, $muestras_crud->etiquetas, 'add');
                }
                $muestras_crud->delete();
            });
            return response()->json(['message' => 'Registro de muestra eliminado']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    private function updateInventoryForMuestra(Inventario $inventario, array $etiquetas, string $action)
    {
        $categoryLabels = $inventario->referencia->categoria->subdivision_stock;
        if (empty($categoryLabels)) {
            // If it's a simple item without labels, just decrement/increment stock
            if ($action === 'subtract') {
                if ($inventario->stock <= 0) throw new \Exception("Sin stock disponible en este estante");
                $inventario->decrement('stock', count($etiquetas));
            } else {
                $inventario->increment('stock', count($etiquetas));
            }
            return;
        }

        $currentSubdiv = $inventario->subdivision_stock ?: [];
        // Ensure all labels exist in the array
        foreach ($categoryLabels as $catLabel) {
            if (!isset($currentSubdiv[$catLabel])) $currentSubdiv[$catLabel] = 0;
        }

        foreach ($etiquetas as $label) {
            if ($action === 'subtract') {
                if ($currentSubdiv[$label] <= 0) {
                    if ($inventario->stock <= 0) throw new \Exception("Sin stock ('$label') disponible en este estante");
                    
                    // Break a full unit
                    $inventario->decrement('stock');
                    foreach ($categoryLabels as $catLabel) {
                        $currentSubdiv[$catLabel]++;
                    }
                }
                $currentSubdiv[$label]--;
            } else {
                $currentSubdiv[$label]++;
                // If all parts of a unit are back, convert them into a full stock unit
                $allBack = true;
                foreach ($categoryLabels as $catLabel) {
                    if ($currentSubdiv[$catLabel] <= 0) {
                        $allBack = false;
                        break;
                    }
                }
                if ($allBack) {
                    $inventario->increment('stock');
                    foreach ($categoryLabels as $catLabel) {
                        $currentSubdiv[$catLabel]--;
                    }
                }
            }
        }

        $inventario->subdivision_stock = $currentSubdiv;
        $inventario->save();
    }
}
