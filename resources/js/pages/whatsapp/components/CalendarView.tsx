import { Calendar as CalendarIcon } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timegridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

interface CalendarViewProps {
    events: any[];
    onDateClick: (info: any) => void;
    onEventClick: (info: any) => void;
}

export function CalendarView({ events, onDateClick, onEventClick }: CalendarViewProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CalendarIcon className="h-5 w-5" />
                    <h2 className="text-lg font-semibold tracking-tight">Calendario de Actividades</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                        Programado
                    </div>
                </div>
            </div>

            <div className="calendar-container min-h-[500px]">
                <FullCalendar
                    plugins={[dayGridPlugin, timegridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    height="700px"
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    dateClick={onDateClick}
                    eventClick={onEventClick}
                    events={events}
                    buttonText={{
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        list: 'Lista'
                    }}
                />
            </div>
        </div>
    );
}
