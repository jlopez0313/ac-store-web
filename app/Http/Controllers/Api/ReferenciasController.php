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
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:255|unique:referencias,codigo',
            'marca' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'foto' => 'nullable|image', // Max 2MB
            'cuenta_id' => auth()->user()->hasRole('superadmin') ? 'required|exists:cuentas,id' : 'nullable',
        ]);

        if (!auth()->user()->hasRole('superadmin')) {
            $validated['cuenta_id'] = auth()->user()->cuenta_id;
        }

        // Handle image upload with compression
        if ($request->hasFile('foto')) {
            $imageService = app(ImageCompressionService::class);
            $validated['foto'] = $imageService->compressImage($request->file('foto'), 'referencias');
        }

        $referencia = Referencia::create($validated);

        // Eager load relationships for the response
        $referencia->load('categoria', 'cuenta');

        return new ReferenciaResource($referencia);
    }

    /**
     * Display the specified resource.
     */
    public function show(Referencia $referencia)
    {
        $referencia->load('categoria', 'cuenta');
        return new ReferenciaResource($referencia);
    }

    /**
     * Update the specified resource in storage.
     * Using POST for updates when handling file uploads in PHP/Laravel (method spoofing)
     * The route should be defined as Route::post('referencias/{referencia}', ...);
     * Or we handle '_method=PUT' in the request automatically via Laravel.
     */
    public function update(Request $request, Referencia $referencia)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:255|unique:referencias,codigo,' . $referencia->id,
            'marca' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
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
            $validated['foto'] = $imageService->compressImage($request->file('foto'), 'referencias');
        }

        $referencia->update($validated);
        $referencia->load('categoria', 'cuenta');

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
}
