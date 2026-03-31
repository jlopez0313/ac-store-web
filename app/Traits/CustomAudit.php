<?php

namespace App\Traits;

trait CustomAudit
{
    public function transformAudit(array $data): array
    {
        $data = $this->baseTransformAudit($data);

        $aliases = [
            'created' => 'Registro creado',
            'updated' => 'Registro modificado',
            'deleted' => 'Registro eliminado',
            'restored' => 'Registro restaurado',
            'abierto' => 'Expediente abierto',
            'cerrado' => 'Expediente cerrado',
            'anulado' => 'Expediente o Documento anulado',
        ];

        $data['event'] = $aliases[$data['event']] ?? $data['event'];

        return $data;
    }
}
