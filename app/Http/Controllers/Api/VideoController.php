<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Video;

class VideoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Video::query();
        
        // Non-superadmins only see videos for 'all' or their specific role
        if ($user->role !== 'superadmin') {
            $query->whereIn('role', ['all', $user->role]);
        }
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasRole('superadmin')) {
            abort(403);
        }

        $validated = $request->validate([
            'role' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tags' => 'nullable|string',
            'link' => 'required|url',
        ]);

        $video = Video::create($validated);

        return response()->json($video);
    }

    public function update(Request $request, Video $video)
    {
        if (!auth()->user()->hasRole('superadmin')) {
            abort(403);
        }

        $validated = $request->validate([
            'role' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tags' => 'nullable|string',
            'link' => 'required|url',
        ]);

        $video->update($validated);

        return response()->json($video);
    }

    public function destroy(Video $video)
    {
        if (!auth()->user()->hasRole('superadmin')) {
            abort(403);
        }

        $video->delete();

        return response()->json(['success' => true]);
    }
}
