<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReferenciaResource;
use App\Models\Categoria;
use App\Models\Cuenta;
use App\Models\Referencia;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferenciasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Referencia::with(['categoria', 'cuenta'])->orderBy('codigo');

        // Tenancy filtering if not superadmin
        if (!auth()->user()->hasRole('superadmin')) {
            $query->where('cuenta_id', auth()->user()->cuenta_id);
        }

        // General search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('codigo', 'like', '%' . $request->search . '%')
                    ->orWhere('marca', 'like', '%' . $request->search . '%')
                    ->orWhere('descripcion', 'like', '%' . $request->search . '%');
            });
        }

        // Sorting logic
        if ($request->filled('sort')) {
            // Check if column is sortable to prevent SQL injection or errors
            $sortableColumns = ['id', 'codigo', 'marca', 'created_at'];
            if (in_array($request->sort, $sortableColumns)) {
                $query->orderBy($request->sort, $request->input('order', 'asc'));
            }
        }

        return Inertia::render('referencias/Index', [
            'filters' => $request->only(['search', 'sort', 'order', 'per_page']),
            'lista' => ReferenciaResource::collection(
                $query->paginate($request->input('per_page', 25))->appends($request->all())
            ),
            'cuentas' => auth()->user()->hasRole('superadmin') ? Cuenta::select('id', 'nombre')->get() : [],
            'categorias' => Categoria::select('id', 'nombre')->orderBy('nombre')->get(),
        ]);
    }

    public function show(Referencia $referencia)
    {
        return response()->json($referencia->load(['categoria', 'cuenta']));
    }

    public function store(Request $request)
    {
        $request->validate([
            'codigo' => 'required|string|max:50',
            'marca' => 'required|string|max:50',
            'descripcion' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
            'foto' => 'nullable|image|max:2048',
        ]);

        $data = $request->all();
        if (!auth()->user()->hasRole('superadmin')) {
            $data['cuenta_id'] = auth()->user()->cuenta_id;
        }

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('referencias', 'public');
        }

        $referencia = Referencia::create($data);

        return response()->json([
            'message' => 'Referencia creada correctamente.',
            'data' => $referencia
        ]);
    }

    public function update(Request $request, Referencia $referencia)
    {
        $request->validate([
            'codigo' => 'required|string|max:50',
            'marca' => 'required|string|max:50',
            'descripcion' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
            'foto' => 'nullable|image|max:2048',
        ]);

        $data = $request->all();

        // Handle image update
        if ($request->hasFile('foto')) {
            // Delete old photo if exists
            if ($referencia->foto) {
                \Storage::disk('public')->delete($referencia->foto);
            }
            $data['foto'] = $request->file('foto')->store('referencias', 'public');
        } else {
            // Keep existing photo if no new one uploaded
            unset($data['foto']);
        }

        $referencia->update($data);

        return response()->json([
            'message' => 'Referencia actualizada correctamente.',
            'data' => $referencia
        ]);
    }

    public function destroy(Referencia $referencia)
    {
        if ($referencia->foto) {
            \Storage::disk('public')->delete($referencia->foto);
        }
        $referencia->delete();

        return response()->json(['message' => 'Referencia eliminada correctamente.']);
    }
}
