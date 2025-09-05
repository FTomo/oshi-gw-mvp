import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import * as XLSX from 'xlsx';
import FullCalendarOrig from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getJpHolidays, isJstWeekend } from '../utils/jpHolidays';
import { useAttendance } from '../hooks/useAttendance';
import { useUser } from '../hooks/useUser';

// カレンダー上で必要な最低限のイベント型
interface CalEvent {
  id: string;
  title: string;
  start: string; // ISO 日付 or 日付+時刻
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
// JST (UTC+9) で日付文字列 YYYY-MM-DD を取得
const fmt = (d: Date) => {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0,10);
};

// 型制限回避用ラッパ（公式型が厳しく dateClick などが不足扱いになるケースへの暫定）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FullCalendar: any = FullCalendarOrig;


export default function AttendancePage() {
  const { me } = useUser();
  const { items, loadRange, punchIn, punchOut, markPlannedOff, updateNote, loading } = useAttendance();
  const [noteEditing, setNoteEditing] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(fmt(new Date()));
  const [calendarRange, setCalendarRange] = useState<{from: string; to: string}>(() => {
    const now = new Date();
    return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
  });

  // 初回 & range 変更時ロード
  useEffect(() => { loadRange(calendarRange.from, calendarRange.to); }, [calendarRange, loadRange]);

  // 今日のレコード（カレンダー範囲外へ移動しても打刻状態を保持）
  const today = fmt(new Date());
  const [todayRecState, setTodayRecState] = useState<any | null>(null);
  const currentTodayRec = items.find(r => r.date === today) || todayRecState;
  useEffect(() => {
    const inItems = items.find(r => r.date === today);
    if (inItems) setTodayRecState(inItems);
  }, [items, today]);

  const handlePunchIn = async () => {
    const rec = await punchIn();
    if (rec) setTodayRecState(rec);
  };
  const handlePunchOut = async () => {
    const rec = await punchOut();
    if (rec) setTodayRecState(rec);
  };

  const handleTogglePlannedOff = async (date: string, next: boolean) => {
    const rec = items.find(r => r.date === date);
    // 出勤打刻済みの日は新規で ON にできない（既に ON のものを OFF にするのは許可）
    if (next && rec && (rec.clockIn || rec.clockOut) && !rec.plannedOff) return;
    await markPlannedOff(date, next);
  };

  const handleSaveNote = async () => {
    let rec = items.find(r => r.date === selectedDate);
    if (!rec) {
      // レコードが無ければ plannedOff=false で作成 → その後メモ反映
      const created = await markPlannedOff(selectedDate, false);
      if (!created) return;
      rec = created as any;
    }
  if (!rec) return;
  await updateNote(rec.id, noteEditing);
  };

  // カレンダーイベント構築
  const events: CalEvent[] = useMemo(() => items.map(r => {
    let title: string;
    if (r.plannedOff) title = '休予定';
    else if (r.clockOut) title = '退勤';
    else if (r.clockIn) title = '出勤';
    else if (r.note) title = 'メモ';
    else title = '勤務';
    return {
      id: r.id,
      start: r.date,
      allDay: true,
      title,
      backgroundColor: r.plannedOff ? '#ffcdd2' : (r.clockIn ? '#bbdefb' : (r.note ? '#d1c4e9' : '#e0e0e0')),
      borderColor: '#90a4ae'
    };
  }), [items]);

  const onDatesSet = (arg: any) => {
    const from = fmt(arg.start);
    const to = fmt(new Date(arg.end.getTime() - 86400000)); // end is next-day
    setCalendarRange({ from, to });
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    const rec = items.find(r => r.date === date);
    setNoteEditing(rec?.note || '');
  };

  const onDateClick = (arg: any) => {
    const date = fmt(arg.date);
    handleSelectDate(date);
  };

  const onEventClick = (arg: any) => {
    const date = fmt(arg.event.start);
    handleSelectDate(date);
  };

  const selectedRec = items.find(r => r.date === selectedDate);
  const selectedPlannedOff = !!selectedRec?.plannedOff;
  const cannotEnablePlannedOff = !selectedPlannedOff && !!(selectedRec && (selectedRec.clockIn || selectedRec.clockOut));

  const handleExportExcel = () => {
    if (items.length === 0) return;
    const rows = items
      .slice()
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(r => ({
        Date: r.date,
        ClockIn: r.clockIn || '',
        ClockOut: r.clockOut || '',
        PlannedOff: r.plannedOff ? 'YES' : '',
        Note: r.note || ''
      }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const fileName = `attendance_${calendarRange.from}_${calendarRange.to}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const holidays = getJpHolidays(new Date().getFullYear());

  const dayCellClassNames = (arg: any) => {
    const dateStr = fmt(arg.date);
    const classes: string[] = [];
    if (isJstWeekend(arg.date)) classes.push('fc-weekend');
    if (holidays.includes(dateStr)) classes.push('fc-holiday');
    if (fmt(arg.date) === selectedDate) classes.push('fc-selected-day');
    return classes;
  };

  return (
    <Box p={2} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
      <Box flex={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">勤怠カレンダー</Typography>
              <Button size="small" variant="outlined" onClick={handleExportExcel} disabled={items.length===0}>Excel出力</Button>
            </Box>
            {loading && <CircularProgress size={24} />}
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="ja"
              height={650}
              events={events as any}
              datesSet={onDatesSet as any}
              dateClick={onDateClick as any}
              eventClick={onEventClick as any}
              dayCellClassNames={dayCellClassNames}
            />
            <style>
              {`.fc-weekend { background:#f2f2f2 !important; }
                .fc-holiday { background:#f2f2f2 !important; }
                .fc-selected-day { outline:2px solid #ff9800; }
              `}
            </style>
          </CardContent>
        </Card>
      </Box>
      <Box flex={2} display="flex" flexDirection="column" gap={2}>
        {/* 打刻専用ブロック（本日） */}
        <Card>
          <CardContent>
            <Typography variant="h6">打刻 (本日 {today})</Typography>
            <Box display="flex" gap={1} mt={1}>
              <Button variant="contained" onClick={handlePunchIn} disabled={!me || !!currentTodayRec?.clockIn}>出勤</Button>
              <Button variant="outlined" onClick={handlePunchOut} disabled={!me || !currentTodayRec?.clockIn || !!currentTodayRec?.clockOut}>退勤</Button>
            </Box>
            {currentTodayRec && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                {currentTodayRec.clockIn ? `出勤: ${currentTodayRec.clockIn.slice(0,5)}` : '未出勤'} / {currentTodayRec.clockOut ? `退勤: ${currentTodayRec.clockOut.slice(0,5)}` : '未退勤'} {currentTodayRec.plannedOff ? '(休予定日)' : ''}
              </Typography>
            )}
            {!currentTodayRec && (
              <Typography variant="body2" color="text.secondary" mt={1}>まだレコードはありません</Typography>
            )}
          </CardContent>
        </Card>
        {/* 休日設定・理由ブロック（カレンダー選択日） */}
        <Card>
          <CardContent>
            <Typography variant="h6">休日設定 / 理由 (選択日 {selectedDate})</Typography>
            <Box mt={1}>
              <FormControlLabel control={<Switch checked={selectedPlannedOff} disabled={cannotEnablePlannedOff} onChange={e => handleTogglePlannedOff(selectedDate, e.target.checked)} />} label={cannotEnablePlannedOff ? '休予定にできません(打刻済)' : '休予定にする'} />
            </Box>
            <TextField
              label="メモ (休む理由 / 備考)"
              fullWidth
              multiline
              minRows={3}
              value={noteEditing}
              onChange={e => setNoteEditing(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Box mt={1} display="flex" gap={1}>
              <Button variant="contained" onClick={handleSaveNote} disabled={!me}>メモ保存</Button>
            </Box>
            {selectedRec && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {selectedRec.clockIn || selectedRec.clockOut ? `この日に打刻: ${(selectedRec.clockIn||'').slice(0,5) || '-'} ~ ${(selectedRec.clockOut||'').slice(0,5) || '-'}` : 'この日に打刻はまだありません'}
              </Typography>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>操作メモ</Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>カレンダー日付クリックで右側編集</li>
                <li>出勤/退勤は当日のみボタン操作</li>
                <li>休予定スイッチは日単位で切替</li>
                <li>打刻時刻は HH:MM 表示（秒非表示）</li>
                <li>メモのみ入力時はカレンダーに「メモ」と表示</li>
                <li>出勤のみ: 「出勤」 / 退勤済: 「退勤」 / 休予定: 「休予定」</li>
              </ul>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
