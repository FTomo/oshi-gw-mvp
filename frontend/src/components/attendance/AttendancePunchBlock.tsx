import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useAttendance } from '../../hooks/useAttendance';
import { useEffect, useState } from 'react';
import { useUser } from '../../hooks/useUser';
import { useNavigate } from 'react-router-dom';

// JST 日付関数 (hooks/useAttendance と揃える)
const jstDate = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0,10);

export function AttendancePunchBlock() {
  const { punchIn, punchOut, items, loadRange } = useAttendance();
  const today = jstDate();
  const navigate = useNavigate();
  // 初期ロード (今日のみ範囲) ※ 再利用時競合少ない極小レンジ
  useEffect(() => {
    const from = today; const to = today;
    loadRange(from, to);
  }, [loadRange, today]);
  const { me } = useUser();
  const [localTodayRec, setLocalTodayRec] = useState<any | null>(null);
  const rec = items.find(r => r.date === today) || localTodayRec;

  useEffect(() => {
    const found = items.find(r => r.date === today);
    if (found) setLocalTodayRec(found);
  }, [items, today]);

  const handleIn = async () => { const r = await punchIn(); if (r) setLocalTodayRec(r); };
  const handleOut = async () => { const r = await punchOut(); if (r) setLocalTodayRec(r); };

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1">今日の勤怠</Typography>
        <Box mt={1.5} display="flex" gap={2} justifyContent="center">
          <Button
            variant="contained"
            onClick={handleIn}
            disabled={!me || !!rec?.clockIn}
            sx={{ px: 4, py: 2, fontSize: '1.1rem', minWidth: 140 }}
          >出勤</Button>
          <Button
            variant="outlined"
            onClick={handleOut}
            disabled={!me || !rec?.clockIn || !!rec?.clockOut}
            sx={{ px: 4, py: 2, fontSize: '1.1rem', minWidth: 140 }}
          >退勤</Button>
        </Box>
        <Typography variant="body1" color="text.secondary" display="block" mt={1} textAlign="center" sx={{ fontSize: 16 }}>
          {rec ? `${rec.clockIn ? '出勤 '+rec.clockIn.slice(0,5) : '未出勤'} / ${rec.clockOut ? '退勤 '+rec.clockOut.slice(0,5) : '未退勤'} ${rec.plannedOff ? '(休予定)' : ''}` : 'まだ打刻なし'}
        </Typography>
        <Box mt={1} display="flex" justifyContent="flex-end">
          <Button size="small" variant="outlined" onClick={() => navigate('/attendance')}>勤怠管理へ</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
