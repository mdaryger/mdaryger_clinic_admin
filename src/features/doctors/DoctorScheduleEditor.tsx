import { Clock3 } from 'lucide-react';

import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import type { DaySlots, DoctorSlot, SlotDuration, WeekSlots } from '../../services/doctorService';

const WEEKDAY_LABELS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'] as const;
const DISPLAY_DAY_ORDER = ['1', '2', '3', '4', '5', '6', '0'] as const;

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
  const buildDayState = (dayIndex: string, base: DaySlots, patch: Partial<DaySlots> = {}): DaySlots => {
    const nextDay = {
      ...base,
      ...patch,
    };

    return {
      ...nextDay,
      slots: nextDay.locked ? [] : generateDaySlots(dayIndex, nextDay),
    };
  };

  const updateDay = (dayIndex: string, patch: Partial<DaySlots>) => {
    onChange({
      ...value,
      [dayIndex]: buildDayState(dayIndex, value[dayIndex], patch),
    });
  };

  const getTemplateDay = (currentDayIndex: string): DaySlots | null => {
    const activeDay = Object.entries(value).find(([dayIndex, daySlots]) => dayIndex !== currentDayIndex && !daySlots.locked);

    return activeDay ? activeDay[1] : null;
  };

  const toggleDay = (dayIndex: string, enabled: boolean) => {
    if (!enabled) {
      onChange({
        ...value,
        [dayIndex]: {
          ...value[dayIndex],
          locked: true,
          slots: [],
        },
      });
      return;
    }

    const templateDay = getTemplateDay(dayIndex);
    const baseDay = templateDay
      ? {
          ...value[dayIndex],
          morningStart: templateDay.morningStart,
          morningEnd: templateDay.morningEnd,
          eveningStart: templateDay.eveningStart,
          eveningEnd: templateDay.eveningEnd,
          slotDuration: templateDay.slotDuration,
        }
      : value[dayIndex];

    onChange({
      ...value,
      [dayIndex]: buildDayState(dayIndex, baseDay, { locked: false }),
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
      {DISPLAY_DAY_ORDER.map((dayIndex) => {
        const daySlots = value[dayIndex];

        return (
        <section key={dayIndex} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2">
            <div>
              <div className="flex items-center gap-3">
                <Checkbox
                  label={WEEKDAY_LABELS[Number(dayIndex)]}
                  checked={!daySlots.locked}
                  onChange={(event) => toggleDay(dayIndex, event.target.checked)}
                />
              </div>
              {daySlots.locked ? null : (
                <p className="mt-1 text-sm text-slate-500">
                  Заполните время работы, обеда и длительность приема.
                </p>
              )}
            </div>
          </div>

          {daySlots.locked ? null : (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Input
                  type="time"
                  label="День начинается"
                  value={daySlots.morningStart}
                  onChange={(event) => updateDay(dayIndex, { morningStart: event.target.value })}
                />
                <Input
                  type="time"
                  label="День заканчивается"
                  value={daySlots.eveningEnd}
                  onChange={(event) => updateDay(dayIndex, { eveningEnd: event.target.value })}
                />
                <Input
                  type="time"
                  label="Обед начинается"
                  value={daySlots.morningEnd}
                  onChange={(event) => updateDay(dayIndex, { morningEnd: event.target.value })}
                />
                <Input
                  type="time"
                  label="Обед заканчивается"
                  value={daySlots.eveningStart}
                  onChange={(event) => updateDay(dayIndex, { eveningStart: event.target.value })}
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Длительность приема</span>
                  <select
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                    value={daySlots.slotDuration}
                    onChange={(event) => updateDay(dayIndex, { slotDuration: Number(event.target.value) as SlotDuration })}
                  >
                    <option value={1800}>30 минут</option>
                    <option value={3600}>60 минут</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-700">Готовые слоты для записи</p>
                </div>

                {daySlots.slots.length === 0 ? (
                  <p className="text-sm text-slate-500">Укажите часы работы, и слоты появятся автоматически.</p>
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
                          onChange={() => toggleSlot(dayIndex, slot.id)}
                          aria-label={`Включить слот ${slot.start} - ${slot.end}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
        );
      })}
    </div>
  );
}
