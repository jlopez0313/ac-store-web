<?php

namespace App\Services;

use App\Models\Cuenta;
use Carbon\Carbon;

class TimeRestrictionService
{
    /**
     * Determina si el usuario puede operar basándose en el rol, horario y días festivos.
     */
    public function canUserOperate($user, $now = null): bool
    {
        if (!$user) return false;

        // Roles exentos de restricción
        if ($user->hasAnyRole(['admin', 'bodega', 'superadmin'])) {
            return true;
        }

        if ($user->role !== 'local') {
            return true;
        }

        $now = $now ? Carbon::parse($now) : now();
        $cuenta = $user->cuenta;

        // 1. Verificar festivos si está habilitado
        $bloquearFestivos = $cuenta ? $cuenta->bloquear_festivos : true;
        if ($bloquearFestivos) {
            if ($this->isColombianHoliday($now)) {
                return false;
            }
        }

        // 2. Verificar horario del día
        return $this->isWithinSchedule($now, $cuenta);
    }

    /**
     * Verifica si la hora actual está dentro de los rangos permitidos para el día de la semana.
     */
    public function isWithinSchedule(Carbon $now, ?Cuenta $cuenta = null): bool
    {
        $dayName = strtolower($now->englishDayOfWeek);
        $horarios = $cuenta ? $cuenta->getHorariosVentasOrDefault() : config("constants.ventas.horarios_locales", []);
        $schedule = $horarios[$dayName] ?? [];

        if (empty($schedule)) {
            return false;
        }

        $currentTime = $now->format('H:i');

        foreach ($schedule as $range) {
            if ($currentTime >= $range[0] && $currentTime <= $range[1]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Obtiene el horario formateado para hoy (útil para el frontend).
     */
    public function getTodaySchedule(Carbon $now, ?Cuenta $cuenta = null): array
    {
        $dayName = strtolower($now->englishDayOfWeek);
        $horarios = $cuenta ? $cuenta->getHorariosVentasOrDefault() : config("constants.ventas.horarios_locales", []);
        return $horarios[$dayName] ?? [];
    }

    /**
     * Lógica para determinar si una fecha es festivo en Colombia (Ley Emiliani).
     */
    public function isColombianHoliday(Carbon $date): bool
    {
        $year = $date->year;
        $holidays = $this->getHolidays($year);

        return in_array($date->format('Y-m-d'), $holidays);
    }

    /**
     * Genera la lista de festivos para un año específico en Colombia.
     */
    public function getHolidays(int $year): array
    {
        $holidays = [];

        // Festivos Fijos
        $holidays[] = "$year-01-01"; // Año Nuevo
        $holidays[] = "$year-05-01"; // Día del Trabajo
        $holidays[] = "$year-07-20"; // Independencia
        $holidays[] = "$year-08-07"; // Batalla de Boyacá
        $holidays[] = "$year-12-08"; // Inmaculada Concepción
        $holidays[] = "$year-12-25"; // Navidad

        // Festivos que se mueven al siguiente lunes (Ley Emiliani)
        $holidays[] = $this->moveToMonday($year, 1, 6);   // Reyes Magos
        $holidays[] = $this->moveToMonday($year, 3, 19);  // San José
        $holidays[] = $this->moveToMonday($year, 6, 29);  // San Pedro y San Pablo
        $holidays[] = $this->moveToMonday($year, 8, 15);  // Asunción
        $holidays[] = $this->moveToMonday($year, 10, 12); // Día de la Raza
        $holidays[] = $this->moveToMonday($year, 11, 2);  // Todos los Santos
        $holidays[] = $this->moveToMonday($year, 11, 16); // Independencia de Cartagena

        // Festivos basados en Pascua (Easter)
        $easter = Carbon::createFromTimestamp(easter_date($year))->timezone('America/Bogota');
        
        // Jueves y Viernes Santo
        $holidays[] = $easter->copy()->subDays(3)->format('Y-m-d');
        $holidays[] = $easter->copy()->subDays(2)->format('Y-m-d');

        // Otros basados en Pascua que se mueven al lunes
        $holidays[] = $this->moveAndDate($easter->copy()->addDays(43)); // Ascensión
        $holidays[] = $this->moveAndDate($easter->copy()->addDays(64)); // Corpus Christi
        $holidays[] = $this->moveAndDate($easter->copy()->addDays(71)); // Sagrado Corazón

        return array_unique($holidays);
    }

    private function moveToMonday($year, $month, $day)
    {
        $date = Carbon::create($year, $month, $day);
        if ($date->dayOfWeek !== Carbon::MONDAY) {
            $date->next(Carbon::MONDAY);
        }
        return $date->format('Y-m-d');
    }

    private function moveAndDate(Carbon $date)
    {
        if ($date->dayOfWeek !== Carbon::MONDAY) {
            $date->next(Carbon::MONDAY);
        }
        return $date->format('Y-m-d');
    }
}
