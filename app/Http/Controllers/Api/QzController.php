<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QzController extends Controller
{
    public function sign(Request $request)
    {
        // We use $request->json('request') to get the raw value if possible, 
        // to avoid any automatic trimming by global middlewares.
        $toSign = $request->json('request');
        
        if (!$toSign) {
             return response()->json(['error' => 'No request data provided'], 400);
        }

        $keyPath = storage_path('app/qz/private-key.pem');
        if (!file_exists($keyPath)) {
            return response()->json(['error' => 'Private key not found'], 500);
        }

        $privateKey = openssl_get_privatekey(file_get_contents($keyPath));
        $signature = '';
        
        // QZ Tray 2.1+ defaults to SHA-512
        openssl_sign($toSign, $signature, $privateKey, OPENSSL_ALGO_SHA512);

        // Debug logging (optional, can be removed after testing)
        // \Log::info('QZ Signing', ['toSign' => $toSign, 'algo' => 'SHA512']);

        if (PHP_MAJOR_VERSION < 8) {
            openssl_free_key($privateKey);
        }

        return response(base64_encode($signature))->header('Content-Type', 'text/plain');
    }

    public function getCertificate()
    {
        $certPath = storage_path('app/qz/digital-certificate.txt');
        if (!file_exists($certPath)) {
            return response()->json(['error' => 'Certificate not found'], 500);
        }

        return response(file_get_contents($certPath));
    }
}
