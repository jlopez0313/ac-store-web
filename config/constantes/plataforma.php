<?php

return [
    'contacto' => [
        'whatsapp' => env('SUPPORT_WHATSAPP', '+57 322 5086903'),
        'email' => env('SUPPORT_EMAIL', 'soporte.bodegastock@gmail.com'),
        'url' => env('SUPPORT_URL', 'https://bodegastock.com'),
    ],
    'metodos_pago' => [
        [
            'name' => 'Bancolombia',
            'details' => env('PAYMENT_BANCOLOMBIA', 'Ahorros: 123-456789-01'),
        ],
        [
            'name' => 'Llave Virtual',
            'details' => env('PAYMENT_LLAVE', '@llavevirtual'),
        ],
        [
            'name' => 'Nequi',
            'details' => env('PAYMENT_NEQUI', '322 5086903'),
        ],
    ],
];
