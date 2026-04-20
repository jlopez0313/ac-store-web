<?php

return [
    /**
     * Horarios permitidos para la adición de referencias en facturas por parte de usuarios con el rol 'Local'.
     * Formato: ['HH:mm', 'HH:mm'] (múltiples rangos permitidos por día).
     * Los días no listados o vacíos se consideran cerrados.
     */
    'horarios_locales' => [
        'monday' => [['09:00', '17:00']],
        'tuesday' => [['09:00', '17:00']],
        'wednesday' => [['09:00', '17:00']],
        'thursday' => [['09:00', '17:00']],
        'friday' => [['09:00', '17:00']],
        'saturday' => [['09:00', '17:00']],
        'sunday' => [], // Cerrado
    ],

    /**
     * Si se deben bloquear las operaciones en días festivos de Colombia para usuarios locales.
     */
    'bloquear_festivos' => true,
];
