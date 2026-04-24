<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QzController extends Controller
{
    public function sign(Request $request)
    {
        // Use raw input to ensure no framework-level string manipulation occurs
        $json = json_decode($request->getContent(), true);
        $toSign = $json['request'] ?? null;
        
        if (!$toSign) {
             return response()->json(['error' => 'No request data provided'], 400);
        }

        $keyPath = storage_path('app/qz/private-key.pem');
        if (!file_exists($keyPath)) {
            return response()->json(['error' => 'Private key not found'], 500);
        }

        $privateKey = openssl_get_privatekey(file_get_contents($keyPath));
        if (!$privateKey) {
            return response()->json(['error' => 'Invalid private key'], 500);
        }

        $signature = '';
        // Try SHA1 first, if it fails we will try SHA512. 
        // Many QZ Tray 2.x versions still expect SHA1 for the signature of the payload.
        openssl_sign($toSign, $signature, $privateKey, OPENSSL_ALGO_SHA1);

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
