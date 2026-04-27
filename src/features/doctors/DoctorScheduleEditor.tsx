import { Clock3, Lock, LockOpen, RefreshCw } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { DaySlots, DoctorSlot, SlotDuration, WeekSlots } from '../../services/doctorService';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

type DoctorScheduleEditorProps = {
  value: WeekSlots;
  onChange: (value: WeekSlots) => void;
};

function timeToSeconds(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60 + minutes) * 60;
}

function secondsToTime(value: number): string {
  const totalMinutes = Math.floor(value / 60);
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function createSlots(start: string, end: string, slotDuration: SlotDuration, prefix: string): DoctorSlot[] {
  const result: DoctorSlot[] = [];
  let current = timeToSeconds(start);
  const finish = timeToSeconds(end);

  while (current + slotDuration <= finish) {
    const next = current + slotDuration;
    const startTime = secondsToTime(current);
    const endTime = secondsToTime(next);

    result.push({
      id: `${prefix}-${startTime}-${endTime}`,
      start: startTime,
      end: endTime,
      enabled: true,
    });

    current = next;
  }

  return result;
}

function generateDaySlots(dayIndex: string, daySlots: DaySlots): DoctorSlot[] {
  const morningSlots = createSlots(daySlots.morningStart, daySlots.morningEnd, daySlots.slotDuration, `${dayIndex}-morning`);
  const eveningSlots = createSlots(daySlots.eveningStart, daySlots.eveningEnd, daySlots.slotDuration, `${dayIndex}-evening`);

  return [...morningSlots, ...eveningSlots];
}

export function DoctorScheduleEditor({ value, onChange }: DoctorScheduleEditorProps) {
  const updateDay = (dayIndex: string, patch: Partial<DaySlots>) => {
    onChange({
      ...value,
      [dayIndex]: {
        ...value[dayIndex],
        ...patch,
      },
    });
  };

  const regenerateSlots = (dayIndex: string) => {
    const daySlots = value[dayIndex];
    updateDay(dayIndex, {
      slots: generateDaySlots(dayIndex, daySlots),
    });
  };

  const toggleSlot = (dayIndex: string, slotId: string) => {
    const daySlots = value[dayIndex];
    updateDay(dayIndex, {
      slots: daySlots.slots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              enabled: !slot.enabled,
            }
          : slot,
      ),
    });
  };

  return (
    <div className="space-y-4">
      {Object.entries(value).map(([dayIndex, daySlots]) => (
        <section key={dayIndex} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950">{WEEKDAY_LABELS[Number(dayIndex)]}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => updateDay(dayIndex, { locked: !daySlots.locked })}
                  aria-label={daySlots.locked ? 'Unlock day' : 'Lock day'}
                >
                  {daySlots.locked ? <Lock className="h-4 w-4" aria-hidden="true" /> : <LockOpen className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {daySlots.locked ? 'This day is locked and unavailable for booking.' : 'Adjust ranges and generate working slots.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => regenerateSlots(dayIndex)} disabled={daySlots.locked}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Generate slots
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Slot duration</span>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                value={daySlots.slotDuration}
                disabled={daySlots.locked}
                onChange={(event) => updateDay(dayIndex, { slotDuration: Number(event.target.value) as SlotDuration })}
              >
                <option value={1800}>30 min</option>
                <option value={3600}>60 min</option>
              </select>
            </label>
            <Input
              type="time"
              label="Morning start"
              value={daySlots.morningStart}
              disabled={daySlots.locked}
              onChange={(event) => updateDay(dayIndex, { morningStart: event.target.value })}
            />
            <Input
              type="time"
              label="Morning end"
              value={daySlots.morningEnd}
              disabled={daySlots.locked}
              onChange={(event) => updateDay(dayIndex, { morningEnd: event.target.value })}
            />
            <Input
              type="time"
              label="Evening start"
              value={daySlots.eveningStart}
              disabled={daySlots.locked}
              onChange={(event) => updateDay(dayIndex, { eveningStart: event.target.value })}
            />
            <Input
              type="time"
              label="Evening end"
              value={daySlots.eveningEnd}
              disabled={daySlots.locked}
              onChange={(event) => updateDay(dayIndex, { eveningEnd: event.target.value })}
            />
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-700">Generated slots</p>
            </div>

            {daySlots.slots.length === 0 ? (
              <p className="text-sm text-slate-500">No slots generated for this day yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {daySlots.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {slot.start} - {slot.end}
                    </span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/25"
                      checked={slot.enabled}
                      disabled={daySlots.locked}
                      onChange={() => toggleSlot(dayIndex, slot.id)}
                      aria-label={`Toggle ${slot.start} - ${slot.end}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
