<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReferenciaResource;
use App\Models\Referencia;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReferenciasController extends Controller
{
    public function getNextCode(Request $request)
    {
        $query = Referencia::query();
        
        // Filter by provided account ID (useful for Superadmins)
        if ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        } else {
            // Fallback to user's account if they aren't superadmin
            $user = auth()->user();
            if ($user->role !== 'superadmin') {
                $query->where('cuenta_id', $user->cuenta_id);
            }
        }

        $lastCode = $query->orderByRaw('CAST(codigo AS UNSIGNED) DESC')->first();
        
        if (!$lastCode) {
            return response()->json(['next_code' => '000001']);
        }

        $nextNumber = intval($lastCode->codigo) + 1;
        $nextCode = str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

        return response()->json(['next_code' => $nextCode]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $sortField = $request->input('sort_field', 'codigo');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Referencia::with(['categoria', 'marca', 'cuenta']);

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%")
                    ->orWhereHas('marca', function ($mq) use ($search) {
                        $mq->where('nombre', 'like', "%{$search}%");
                    });
            });
        }

        if ($sortField === 'marca') {
            $query->join('marcas', 'referencias.marca_id', '=', 'marcas.id')
                ->select('referencias.*')
                ->orderBy('marcas.nombre', $sortOrder);
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $paginated = $query->paginate($request->input('per_page', 25));

        return ReferenciaResource::collection($paginated);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:255|unique:referencias,codigo',
            'marca_id' => 'required|string|max:255',
            'categoria_id' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'foto' => 'nullable|image', // Max 2MB
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            $validated['cuenta_id'] = auth()->user()->cuenta_id;
        }

        // Handle image upload with compression
        if ($request->hasFile('foto')) {
            $imageService = app(ImageCompressionService::class);
            $path = 'referencias/' . $validated['cuenta_id'];
            $filename = $validated['codigo']; // Usar el código como nombre de archivo para consistencia
            $validated['foto'] = $imageService->compressImage($request->file('foto'), $path, $filename);
        }

        $referencia = Referencia::create($validated);

        // Eager load relationships for the response
        $referencia->load('categoria', 'marca', 'cuenta');

        return new ReferenciaResource($referencia);
    }

    /**
     * Display the specified resource.
     */
    public function show(Referencia $referencia)
    {
        $referencia->load('categoria', 'marca', 'cuenta');
        return new ReferenciaResource($referencia);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Referencia $referencia)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:255|unique:referencias,codigo,' . $referencia->id,
            'marca_id' => 'required|string|max:255',
            'categoria_id' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'foto' => 'nullable|image',
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            unset($validated['cuenta_id']); // Block non-superadmins from changing accounts
        }

        // Handle image upload and replace logic
        if ($request->hasFile('foto')) {
            // Delete old photo if it exists
            if ($referencia->foto && Storage::disk('public')->exists($referencia->foto)) {
                Storage::disk('public')->delete($referencia->foto);
            }
            // Store new photo with compression
            $imageService = app(ImageCompressionService::class);
            $path = 'referencias/' . ($validated['cuenta_id'] ?? $referencia->cuenta_id);
            $filename = $validated['codigo'] ?? $referencia->codigo;
            $validated['foto'] = $imageService->compressImage($request->file('foto'), $path, $filename);
        }

        $referencia->update($validated);
        $referencia->load('categoria', 'marca', 'cuenta');

        return new ReferenciaResource($referencia);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Referencia $referencia)
    {
        // Delete associated image
        if ($referencia->foto && Storage::disk('public')->exists($referencia->foto)) {
            Storage::disk('public')->delete($referencia->foto);
        }

        $referencia->delete();
        return response()->json(['message' => 'Referencia eliminada correctamente']);
    }

    public function getList(Request $request)
    {
        $user = auth()->user();
        $isSuper = $user->role === 'superadmin';

        $query = Referencia::orderBy('codigo');

        if (!$isSuper) {
            $query->where('cuenta_id', $user->cuenta_id);
        } elseif ($request->filled('cuenta_id')) {
            $query->where('cuenta_id', $request->cuenta_id);
        }

        if ($request->filled('bodega_id')) {
            $query->whereHas('inventarios', function ($q) use ($request) {
                $q->where('stock', '>', 0)
                  ->whereHas('estanteria', function ($sq) use ($request) {
                      $sq->where('bodega_id', $request->bodega_id);
                  });
            });
        } else {
            $query->whereHas('inventarios', function ($q) {
                $q->where('stock', '>', 0);
            });
        }

        return response()->json($query->with(['inventarios' => function($q) {
            $q->where('stock', '>', 0);
        }])->get()->map(function($r) use ($user, $request) {
            $precioBase = $r->inventarios->max('precio_venta');
            $descuento = 0;
            
            // Apply discount if user is local and bodega is selected
            if ($user->role === 'local' && $request->filled('bodega_id')) {
                $acceso = \App\Models\BodegaAcceso::where('bodega_id', $request->bodega_id)
                    ->where('user_id', $user->id)
                    ->first();
                
                if ($acceso && $acceso->descuento > 0) {
                    $descuento = $acceso->descuento;
                    $precioBase = max(0, $precioBase - $descuento);
                }
            }

            $tallas = $r->inventarios->pluck('talla')->unique()->sort()->values()->toArray();
            
            return [
                'id' => $r->id,
                'codigo' => $r->codigo,
                'descripcion' => $r->descripcion,
                'precio' => $precioBase,
                'descuento' => $descuento,
                'tallas' => $tallas,
                'foto' => $r->foto ? asset('storage/' . $r->foto) : null,
                'name' => "{$r->codigo} - " . ($r->descripcion ?: 'Sin descripción')
            ];
        }));
    }
}
