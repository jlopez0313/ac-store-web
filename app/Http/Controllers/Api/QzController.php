<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QzController extends Controller
{
    public function sign(Request $request)
    {
        $request->validate([
            'request' => 'required|string',
        ]);

        $keyPath = storage_path('app/qz/private-key.pem');
        if (!file_exists($keyPath)) {
            return response()->json(['error' => 'Private key not found'], 500);
        }

        $privateKey = openssl_get_privatekey(file_get_contents($keyPath));
        $signature = '';
        openssl_sign($request->input('request'), $signature, $privateKey, OPENSSL_ALGO_SHA512);

        if (PHP_MAJOR_VERSION < 8) {
            openssl_free_key($privateKey);
        }

        return response()->json(base64_encode($signature));
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
