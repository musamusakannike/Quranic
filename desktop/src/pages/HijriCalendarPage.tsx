import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  getHijriMonthGrid,
  gregorianToHijri,
  stepHijriMonth,
  type CalendarCell,
} from "../lib/hijri";
import { useSettingsStore } from "../stores/settingsStore";
import { useI18n } from "../hooks/useI18n";
import { Button, SegmentedControl } from "../components/ui";

export const HijriCalendarPage: React.FC = () => {
  const { dict, num, lang, isRTL } = useI18n();
  const offsetDays = useSettingsStore((s) => s.hijriOffsetDays);
  const updateSettings = useSettingsStore((s) => s.update);

  const today = useMemo(() => new Date(), []);
  const todayHijri = useMemo(
    () => gregorianToHijri(today, offsetDays),
    [today, offsetDays],
  );

  const [cursor, setCursor] = useState({
    iYear: todayHijri.iYear,
    iMonth: todayHijri.iMonth,
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    `${todayHijri.iYear}-${todayHijri.iMonth}-${todayHijri.iDay}`,
  );

  const grid = useMemo(
    () => getHijriMonthGrid(cursor.iYear, cursor.iMonth, offsetDays, today),
    [cursor, offsetDays, today],
  );

  const selectedCell = useMemo(() => {
    const found = grid.cells.find(
      (c): c is Extract<CalendarCell, { type: "day" }> =>
        c.type === "day" && c.id === selectedId,
    );
    if (found) return found;
    return grid.cells.find(
      (c): c is Extract<CalendarCell, { type: "day" }> => c.type === "day",
    );
  }, [grid.cells, selectedId]);

  const monthName = dict.hijri.months[cursor.iMonth - 1] ?? "";
  const gregFormatter = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    year: "numeric",
  });
  const gregFullFormatter = new Intl.DateTimeFormat(
    lang === "ar" ? "ar-EG" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const jumpToToday = () => {
    const h = gregorianToHijri(new Date(), offsetDays);
    setCursor({ iYear: h.iYear, iMonth: h.iMonth });
    setSelectedId(`${h.iYear}-${h.iMonth}-${h.iDay}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[960px] px-8 py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">
              {dict.hijri.title}
            </h1>
            <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
              {gregFormatter.format(grid.gregorianRange.start)} –{" "}
              {gregFormatter.format(grid.gregorianRange.end)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
              <span>{dict.hijri.moonOffset}</span>
              <SegmentedControl<"-1" | "0" | "1">
                ariaLabel={dict.hijri.moonOffset}
                value={String(offsetDays) as "-1" | "0" | "1"}
                onChange={(v) =>
                  updateSettings({ hijriOffsetDays: Number(v) as -1 | 0 | 1 })
                }
                options={[
                  { value: "-1", label: "-1" },
                  { value: "0", label: "0" },
                  { value: "1", label: "+1" },
                ]}
              />
            </div>
            <Button variant="subtle" size="sm" onClick={jumpToToday}>
              <CalendarIcon size={14} /> {dict.hijri.jumpToToday}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="icon"
                size="sm"
                onClick={() =>
                  setCursor((c) => stepHijriMonth(c.iYear, c.iMonth, -1))
                }
                aria-label={dict.common.previous}
              >
                {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>
              <h2 className="text-[18px] font-bold">
                {monthName} {num(cursor.iYear)}
              </h2>
              <Button
                variant="icon"
                size="sm"
                onClick={() =>
                  setCursor((c) => stepHijriMonth(c.iYear, c.iMonth, 1))
                }
                aria-label={dict.common.next}
              >
                {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-[var(--color-border)] pb-2 text-center text-[12px] font-semibold text-[var(--color-text-muted)]">
              {dict.hijri.weekDays.map((day, idx) => (
                <div
                  key={day}
                  className={idx === 5 ? "text-[var(--color-primary)]" : ""}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="mt-2 grid grid-cols-7 gap-1">
              {grid.cells.map((cell) => {
                if (cell.type === "empty") {
                  return <div key={cell.id} className="h-16" />;
                }
                const isSelected = selectedCell?.id === cell.id;
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => setSelectedId(cell.id)}
                    className={`relative flex h-16 flex-col items-center justify-center rounded-[8px] border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)]"
                        : cell.isToday
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)]/50"
                          : cell.isFriday
                            ? "border-transparent bg-[var(--color-primary-tint)]/35 hover:bg-[var(--color-surface-2)]"
                            : "border-transparent hover:bg-[var(--color-surface-2)]"
                    }`}
                  >
                    <span
                      className={`text-[15px] font-semibold tabular-nums ${
                        cell.isToday
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text)]"
                      }`}
                    >
                      {num(cell.iDay)}
                    </span>
                    <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
                      {num(cell.gregorian.getDate())}
                    </span>
                    {cell.events.length > 0 && (
                      <span
                        className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: cell.events[0]!.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side Panel: Selected Day & Month Events */}
          <aside className="lg:col-span-4 space-y-6 border-t lg:border-t-0 lg:border-s border-[var(--color-border)] pt-6 lg:pt-0 lg:ps-6">
            {selectedCell && (
              <div className="border-b border-[var(--color-border)] pb-5">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {dict.hijri.selectedDay}
                </div>
                <div className="mt-2 text-[20px] font-bold text-[var(--color-primary)]">
                  {num(selectedCell.iDay)} {monthName} {num(selectedCell.iYear)}
                </div>
                <div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                  {gregFullFormatter.format(selectedCell.gregorian)}
                </div>
                {selectedCell.isFriday && (
                  <span className="mt-2 inline-block rounded-full bg-[var(--color-primary-tint)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                    {dict.hijri.friday}
                  </span>
                )}
                {selectedCell.events.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {selectedCell.events.map((ev) => (
                      <div
                        key={ev.key}
                        className="flex items-center gap-2 text-[13px] font-medium"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color }}
                        />
                        {dict.hijri.events[ev.key]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                {dict.hijri.eventsThisMonth}
              </h3>
              {grid.monthEvents.length === 0 ? (
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  {dict.hijri.noEventsThisMonth}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {grid.monthEvents.map(({ day, event }) => (
                    <button
                      key={`${day}-${event.key}`}
                      type="button"
                      onClick={() =>
                        setSelectedId(`${cursor.iYear}-${cursor.iMonth}-${day}`)
                      }
                      className="flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-start hover:bg-[var(--color-surface-2)] cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-[13px] font-medium">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        {dict.hijri.events[event.key]}
                      </span>
                      <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                        {num(day)} {monthName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
