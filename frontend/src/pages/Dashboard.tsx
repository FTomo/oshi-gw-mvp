// =============================
// src/pages/Dashboard.tsx
// =============================
import { Box, Card, CardContent, Typography, Grid } from '@mui/material'
import { useRecoilValue } from 'recoil'
import { currentUserAtom } from '../state/auth'

export default function Dashboard() {
  const user = useRecoilValue(currentUserAtom)
  return (
    <Box>
      <Typography variant="h5" gutterBottom>ようこそ、{user?.name ?? user?.email ?? 'User'} さん</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        本日の予定・勤怠・タスク状況を確認できます
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle1">カレンダー（後で FullCalendar 組込み）</Typography>
            <Box sx={{ height: 280, bgcolor: 'action.hover', borderRadius: 2 }} />
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle1">今日の勤怠（出勤 / 退勤）</Typography>
            <Box sx={{ height: 80, bgcolor: 'action.hover', borderRadius: 2 }} />
          </CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="subtitle1">自分のタスク（ガントは別画面）</Typography>
            <Box sx={{ height: 160, bgcolor: 'action.hover', borderRadius: 2 }} />
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}