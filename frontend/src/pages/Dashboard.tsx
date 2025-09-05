// =============================
// src/pages/Dashboard.tsx
// =============================
import { Box, Card, CardContent, Typography } from '@mui/material'
import { useUser } from '../hooks/useUser'
import { AttendancePunchBlock } from '../components/attendance/AttendancePunchBlock'
import { UnifiedCalendar } from '../components/calendar/UnifiedCalendar'


export default function Dashboard() {
  const { me } = useUser()
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        ようこそ、{me?.name ?? me?.email ?? 'User'} さん
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        本日の予定・勤怠・タスク状況を確認できます
      </Typography>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mt={1}>
        <Box flex={1}>
          <Card><CardContent>
            <Typography variant="subtitle1" gutterBottom>統合カレンダー</Typography>
            <UnifiedCalendar />
          </CardContent></Card>
        </Box>
        <Box flex={1}>
          <AttendancePunchBlock />
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="subtitle1">自分のタスク（ガントは別画面）</Typography>
            <Box sx={{ height: 160, bgcolor: 'action.hover', borderRadius: 2 }} />
          </CardContent></Card>
        </Box>
      </Box>
    </Box>
  )
}