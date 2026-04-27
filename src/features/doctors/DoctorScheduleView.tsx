import { CalendarDays, Clock3, Lock } from 'lucide-react';

import { EmptyState } from '../../components/EmptyState';
import type { WeekSlots } from '../../services/doctorService';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

type DoctorScheduleViewProps = {
  weekSlots?: WeekSlots | null;
};

export function DoctorScheduleView({ weekSlots }: DoctorScheduleViewProps) {
  if (!weekSlots || Object.keys(weekSlots).length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Schedule not configured"
        description="Working slots will appear here after the doctor schedule is configured."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {Object.entries(weekSlots).map(([dayIndex, daySlots]) => {
        const enabledSlots = daySlots.slots.filter((slot) => slot.enabled);

        return (
          <section key={dayIndex} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{WEEKDAY_LABELS[Number(dayIndex)]}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {daySlots.locked
                    ? 'Day is locked'
                    : `${daySlots.morningStart} - ${daySlots.morningEnd}, ${daySlots.eveningStart} - ${daySlots.eveningEnd}`}
                </p>
              </div>
              {daySlots.locked ? <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" /> : <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />}
            </div>

            <div className="mt-4">
              {daySlots.locked ? (
                <p className="text-sm text-slate-500">Unavailable</p>
              ) : enabledSlots.length === 0 ? (
                <p className="text-sm text-slate-500">No active slots for this day.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {enabledSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {slot.start} - {slot.end}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
