// =============================
// src/pages/Dashboard.tsx
// =============================
import { Box, Card, CardContent, Typography, List, ListItemButton, ListItemText, Chip, Divider, CircularProgress, Stack, Button, CardActions } from '@mui/material'
import React from 'react'
import { useUser } from '../hooks/useUser'
import { AttendancePunchBlock } from '../components/attendance/AttendancePunchBlock'
import { UnifiedCalendar } from '../components/calendar/UnifiedCalendar'
import { useEffect, useMemo, useState } from 'react'
import { projectService, type DbProject } from '../services/projectService'
import { taskService, type DbTask } from '../services/taskService'
import { useNavigate } from 'react-router-dom'


export default function Dashboard() {
  const { me } = useUser()
  const navigate = useNavigate()

  // 自分の担当タスク収集
  const [loadingMy, setLoadingMy] = useState(false)
  const [myByProject, setMyByProject] = useState<Array<{ project: DbProject; tasks: DbTask[] }>>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!me?.sub) { setMyByProject([]); return }
      setLoadingMy(true)
      try {
        // 全プロジェクト取得（ページング）
        const projects: DbProject[] = []
        let next: string | null | undefined = undefined
        do {
          const page = await projectService.list(200, next)
          projects.push(...(page.items || []))
          next = page.nextToken
        } while (next)

        // 各プロジェクトのタスクを取得し、自分担当・未完了のみ抽出
        const groups: Array<{ project: DbProject; tasks: DbTask[] }> = []
        for (const p of projects) {
          const all = await taskService.listByProject(p.id)
          const mine = all.filter(t => t.assigneeUserId === me.sub && (t.progress ?? 0) < 100)
          if (mine.length > 0) {
            // 遅延日数で降順ソート
            const sorted = [...mine].sort((a, b) => overdueDays(b) - overdueDays(a) || compareDateAsc(a.endDate, b.endDate))
            groups.push({ project: p, tasks: sorted })
          }
        }

        if (!cancelled) setMyByProject(groups)
      } finally {
        if (!cancelled) setLoadingMy(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [me?.sub])

  const hasAny = useMemo(() => myByProject.some(g => g.tasks.length > 0), [myByProject])

  // ユーティリティ
  const todayStr = new Date().toISOString().slice(0,10)
  function parseYmd(s?: string | null) { return s ? new Date(s + 'T00:00:00Z') : null }
  function diffDays(a: Date, b: Date) { return Math.floor((a.getTime() - b.getTime()) / 86400000) }
  function overdueDays(t: DbTask) {
    if (!t.endDate || (t.progress ?? 0) >= 100) return 0
    const end = parseYmd(t.endDate)!
    const today = parseYmd(todayStr)!
    return Math.max(0, diffDays(today, end))
  }
  function compareDateAsc(a?: string | null, b?: string | null) {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a.localeCompare(b)
  }
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
          {/* 勤怠打刻ブロック（ボタン含む） */}
          <AttendancePunchBlock />
          <Card sx={{ mt: 2 }}>
            <CardContent>
            <Typography variant="subtitle1">自分のタスク</Typography>
            {loadingMy && (
              <Box mt={1}><CircularProgress size={20} /></Box>
            )}
            {!loadingMy && !hasAny && (
              <Typography variant="body2" color="text.secondary" mt={1}>担当中のタスクはありません</Typography>
            )}
            {!loadingMy && hasAny && (
              <Stack spacing={2} mt={1}>
                {myByProject.map(group => (
                  <Box key={group.project.id}>
                    <Typography variant="subtitle2" gutterBottom>{group.project.name}</Typography>
                    <List dense>
                      {group.tasks.map((t) => {
                        const od = overdueDays(t)
                        return (
                          <React.Fragment key={t.id}>
                            <ListItemButton onClick={() => navigate(`/projects/${group.project.id}`)}>
                              <ListItemText
                                primary={t.title}
                                secondary={
                                  t.endDate ? `期日: ${t.endDate}${(t.progress ?? 0) > 0 ? ` / 進捗 ${t.progress}%` : ''}` : ((t.progress ?? 0) > 0 ? `進捗 ${t.progress}%` : undefined)
                                }
                              />
                              {od > 0 && <Chip color="error" size="small" label={`遅延 ${od}日`} />}
                            </ListItemButton>
                            <Divider component="li" />
                          </React.Fragment>
                        )
                      })}
                    </List>
                  </Box>
                ))}
              </Stack>
            )}
            {/* 右下ボタン: プロジェクト管理へ */}
            <Box position="absolute" right={8} bottom={8}>
              <Button size="small" variant="outlined" onClick={() => navigate('/projects')}>プロジェクト管理へ</Button>
            </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
              <Button size="small" variant="outlined" onClick={() => navigate('/projects')}>プロジェクト管理へ</Button>
            </CardActions>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}