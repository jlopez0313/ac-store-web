<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\SoftDeletes;

trait Blameable
{
    use SoftDeletes {
        SoftDeletes::performDeleteOnModel as performSoftDelete;
    }

    public static function bootBlameable()
    {
        static::creating(function ($model) {
            if (\Auth::check()) {
                $model->creado_por = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (\Auth::check()) {
                $model->modificado_por = auth()->id();
            }
        });

        static::deleting(function ($model) {
            if (\Auth::check()) {
                $model->eliminado_por = auth()->id();
            }
        });
    }

    protected function performDeleteOnModel()
    {
        if ($this->forceDeleting) {
            $this->performSoftDelete();

            return;
        }

        $this->{$this->getDeletedAtColumn()} = $this->freshTimestamp();
        $this->eliminado_por = auth()->id();

        $this->saveQuietly();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function eliminador()
    {
        return $this->belongsTo(User::class, 'eliminado_por');
    }

    public function auditEvent(string $event, array $values = [])
    {
        \OwenIt\Auditing\Models\Audit::create([
            'auditable_type' => static::class,
            'auditable_id' => $this->id,
            'event' => $event,
            'old_values' => [],
            'new_values' => $values,
            'user_id' => auth()->id(),
            'user_type' => get_class(auth()->user()),
            'url' => request()->fullUrl(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
