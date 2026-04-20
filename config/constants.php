<?php

return [

    'estados' => require 'constantes/estados.php',
    'tipos_muestras' => require 'constantes/muestras.php',
    'tipos_documento' => require 'constantes/documentos.php',
    'suscripciones' => require 'constantes/suscripciones.php',
    'ventas' => require 'constantes/ventas.php',

    'printer_name' => env('PRINTER_NAME', '3nStar RPT004'),

];
