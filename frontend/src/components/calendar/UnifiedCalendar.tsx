import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendarOrig from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAttendance } from '../../hooks/useAttendance';
import { getJpHolidays, isJstWeekend } from '../../utils/jpHolidays';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FullCalendar: any = FullCalendarOrig;

// 祝日取得 hook（静的リスト利用）
const useJpHolidays = (year: number) => {
  const [holidays, setHolidays] = useState<string[]>([]);
  useEffect(() => { setHolidays(getJpHolidays(year)); }, [year]);
  return holidays;
};

const fmt = (d: Date) => new Date(d.getTime() + 9*3600*1000).toISOString().slice(0,10);

interface UnifiedCalendarProps {
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function UnifiedCalendar({ selectedDate, onSelectDate }: UnifiedCalendarProps) {
  const { items, loadRange } = useAttendance();
  const calRef = useRef<any>(null);
  const [range, setRange] = useState<{from: string; to: string}>(() => {
    const now = new Date();
    const from = fmt(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = fmt(new Date(now.getFullYear(), now.getMonth()+1, 0));
    return { from, to };
  });
  useEffect(() => { loadRange(range.from, range.to); }, [range, loadRange]);

  const year = new Date().getFullYear();
  const holidays = useJpHolidays(year);

  const events = useMemo(() => items.map(r => {
    let title: string;
    if (r.plannedOff) title = '休予定';
    else if (r.clockOut) title = '退勤';
    else if (r.clockIn) title = '出勤';
    else if (r.note) title = 'メモ';
    else title = '勤務';
    return { id: r.id, start: r.date, title, allDay: true };
  }), [items]);

  const todayJst = fmt(new Date());

  const onDatesSet = (arg: any) => {
    const from = fmt(arg.start);
    const to = fmt(new Date(arg.end.getTime() - 86400000));
    setRange({ from, to });
  };
  const onDateClick = (arg: any) => { onSelectDate?.(fmt(arg.date)); };
  const onEventClick = (arg: any) => { onSelectDate?.(fmt(arg.event.start)); };

  const dayCellClassNames = (arg: any) => {
    const dateStr = fmt(arg.date);
    const classes: string[] = [];
    if (isJstWeekend(arg.date)) classes.push('fc-weekend');
    if (holidays.includes(dateStr)) classes.push('fc-holiday');
    if (selectedDate && dateStr === selectedDate) classes.push('fc-selected-day');
    if (dateStr === todayJst) classes.push('fc-today-bg');
    return classes;
  };

  return (
    <>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ja"
        height={400}
        customButtons={{
          todayCustom: {
            text: '今日',
            click: () => {
              const api = calRef.current?.getApi?.();
              api?.today();
              onSelectDate?.(todayJst);
            }
          }
        }}
        headerToolbar={{ left: 'title', center: '', right: 'prev,next todayCustom' }}
        events={events as any}
        datesSet={onDatesSet as any}
        dateClick={onDateClick as any}
        eventClick={onEventClick as any}
        dayCellClassNames={dayCellClassNames}
      />
      <style>
        {`
          .fc-weekend { background:#f2f2f2 !important; }
          .fc-holiday { background:#f2f2f2 !important; }
          .fc-selected-day { outline:2px solid #ff9800; }
          .fc-today-bg { background: #fff9c4 !important; }
        `}
      </style>
    </>
  );
}
