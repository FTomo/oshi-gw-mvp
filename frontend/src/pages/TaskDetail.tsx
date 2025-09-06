import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, Autocomplete } from '@mui/material';
import styles from './TaskDetail.module.css';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useTask } from '../hooks/useTask';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import type { ProjectParticipant } from '../services/projectService';
import { generateAssigneeId } from '../services/projectService';
import { displayTaskNumber } from '../services/taskService';

export default function TaskDetail() {
  const { projectId } = useParams();
  const { getById, me, saveParticipants } = useProject();
  const { items, loadByProject, createRoot, createChild, update, remove, ganttTasks } = useTask(projectId);

  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month); // ボタンブロックB: 月/週/日
  const [fullScreen, setFullScreen] = useState(false); // ボタンブロックB: 全画面
  const [openParticipants, setOpenParticipants] = useState(false);
  const [editParticipants, setEditParticipants] = useState<ProjectParticipant[]>([]);
  const [pendingDates, setPendingDates] = useState<Record<string, { startDate?: string | null; endDate?: string | null }>>({});
  const [colWidths, setColWidths] = useState({ no: 60, assignee: 80, title: 214, start: 120, end: 120, progress: 48 });
  const resizingRef = useRef<{ key: keyof typeof colWidths; startX: number; startW: number } | null>(null);
  const gridCols = React.useMemo(() => (
    `${colWidths.no}px ${colWidths.assignee}px ${colWidths.title}px ${colWidths.start}px ${colWidths.end}px ${colWidths.progress}px`
  ), [colWidths]);
  const listWidthPx = React.useMemo(() => (
    colWidths.no + colWidths.assignee + colWidths.title + colWidths.start + colWidths.end + colWidths.progress
  ), [colWidths]);

  const onResizeStart = (key: keyof typeof colWidths) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startW: colWidths[key] };
    const onMove = (mv: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key: k, startX, startW } = resizingRef.current;
      const dx = mv.clientX - startX;
      const min = k === 'title' ? 120 : 40;
      setColWidths(prev => ({ ...prev, [k]: Math.max(min, Math.round(startW + dx)) }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      resizingRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Root create dialog
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState('');
  const [rootStart, setRootStart] = useState<string>('');
  const [rootEnd, setRootEnd] = useState<string>('');
  const [rootProgress, setRootProgress] = useState<number>(0);

  // Child create dialog
  const [openChild, setOpenChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childParentId, setChildParentId] = useState<string | null>(null);
  const [childAssigneeId, setChildAssigneeId] = useState<string | null>(null);
  const [childStart, setChildStart] = useState<string>('');
  const [childEnd, setChildEnd] = useState<string>('');
  const [childProgress, setChildProgress] = useState<number>(0);

  // Edit dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');
  const [editAssigneeId, setEditAssigneeId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [openDelete1, setOpenDelete1] = useState(false);
  const [openDelete2, setOpenDelete2] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      try {
        const p = await getById(projectId);
        setProjectName(p?.name ?? '');
        if (p?.participantsJson) {
          try {
            const raw = JSON.parse(p.participantsJson) as any[];
            const normalized = (Array.isArray(raw) ? raw : []).map((x: any) => ({
              assigneeUserId: x.assigneeUserId ?? generateAssigneeId(),
              userId: x.userId ?? null,
              name: x.name ?? '',
              displayName: x.displayName ?? x.name ?? '',
              canEdit: !!x.canEdit,
              canView: !!x.canView,
            })) as ProjectParticipant[];
            setParticipants(normalized);
          } catch {
            setParticipants([]);
          }
        } else {
          setParticipants([]);
        }
        await loadByProject(projectId);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, getById, loadByProject]);

  const addRoot = async () => {
    if (!projectId || !me) return;
  const created = await createRoot(me.sub, { title, startDate: rootStart || undefined, endDate: rootEnd || undefined, progress: rootProgress });
    if (created) setOpenNew(false);
  };

  // 表示用: タスクがゼロのときは仮想ルートタスクを1件表示（DB保存しない）
  const visualTasks = React.useMemo(() => {
    if (ganttTasks.length > 0) {
      const mapped = ganttTasks.map(gt => {
        const override = pendingDates[String((gt as any).id)] || {};
        const startOverride = override.startDate ? new Date(override.startDate) : undefined;
        const endOverride = override.endDate ? new Date(override.endDate) : undefined;
        return {
          ...gt,
          start: startOverride ?? (gt as any).start,
          end: endOverride ?? (gt as any).end,
          // 左ペインで担当列を別表示するため、name は純粋な説明のみ
          name: gt.name,
          styles: {
            ...(gt as any).styles,
            // 未選択は薄い色、選択時は濃い色
            backgroundColor: '#90CAF9',
            backgroundSelectedColor: '#1976D2',
            progressColor: '#64B5F6',
            progressSelectedColor: '#0D47A1',
          },
        } as any;
      });
      return mapped;
    }
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return [
      {
        id: 'virtual-root',
        name: '（未作成のタスク）',
        start: today,
        end: tomorrow,
        progress: 0,
        type: 'task' as const,
        project: projectId,
      },
    ];
  }, [ganttTasks, items, participants, projectId, selectedTaskId, pendingDates, viewMode]);

  // ツールチップ: カーソル位置とかぶらないようにコンテンツを少しオフセット
  const TooltipContent = React.useCallback(({ task }: any) => {
    if (!task || task.id === 'virtual-root') return null;
    const start = task.start?.toLocaleDateString?.() ?? '';
    const end = task.end?.toLocaleDateString?.() ?? '';
    return (
      <div style={{
        transform: 'translate(12px, 12px)',
        pointerEvents: 'none',
        background: 'rgba(33,33,33,0.9)',
        color: '#fff',
        padding: '6px 8px',
        borderRadius: 4,
        fontSize: 12,
        maxWidth: 260,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{task.name}</div>
        <div>開始: {start}</div>
        <div>終了: {end}</div>
        {typeof task.progress === 'number' ? <div>進捗: {task.progress}%</div> : null}
      </div>
    );
  }, []);

  return (
    <Box className={styles.taskDetail}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">プロジェクト: {projectName}</Typography>
        <Button variant="contained" onClick={() => { setTitle(''); setRootStart(''); setRootEnd(''); setOpenNew(true); }}>ルートタスク追加</Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            ガントチャート
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" className={styles.toolbarA}>
              {ganttTasks.length === 0 && (
                <Button size="small" variant="outlined" onClick={() => { setTitle(''); setRootStart(''); setRootEnd(''); setOpenNew(true); }}>
                  最初のタスクを編集
                </Button>
              )}
              <Button size="small" variant="outlined" onClick={() => { setEditParticipants(participants); setOpenParticipants(true); }}>担当者</Button>
              <Button
                size="small"
                variant="contained"
                disabled={!selectedTaskId || !items.find(t => t.id === selectedTaskId && t.level === 1)}
                onClick={() => {
                  const parent = items.find(t => t.id === selectedTaskId);
                  if (!parent) return;
                  setChildParentId(parent.id);
                  setChildTitle('');
                  setChildAssigneeId(null);
                  setChildStart('');
                  setChildEnd('');
                  setOpenChild(true);
                }}
              >
                子タスク追加
              </Button>
        <Button
                size="small"
                variant="outlined"
                disabled={!selectedTaskId}
                onClick={() => {
                  const cur = items.find(t => t.id === selectedTaskId);
                  if (!cur) return;
                  setEditTitle(cur.title);
                  setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                  setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
          setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                  setOpenEdit(true);
                }}
              >
                編集
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={!selectedTaskId}
                onClick={() => setOpenDelete1(true)}
              >
                削除
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {selectedTaskId ? '選択中: タスクID ' + selectedTaskId : 'クリックで選択 / もう一度で解除'}
            </Typography>
          </Box>

          {/* ボタンブロックB: 表示切替 + 全画面 */}
          <Box display="flex" className={styles.toolbarB} justifyContent="flex-end" mb={1}>
            <Button size="small" variant={viewMode === ViewMode.Month ? 'contained' : 'outlined'} onClick={() => setViewMode(ViewMode.Month)}>月</Button>
            <Button size="small" variant={viewMode === ViewMode.Week ? 'contained' : 'outlined'} onClick={() => setViewMode(ViewMode.Week)}>週</Button>
            <Button size="small" variant={viewMode === ViewMode.Day ? 'contained' : 'outlined'} onClick={() => setViewMode(ViewMode.Day)}>日</Button>
            <Button size="small" variant="outlined" onClick={() => setFullScreen(s => !s)}>{fullScreen ? '全画面解除' : '全画面'}</Button>
          </Box>

          {!loading && (
            <Box className={styles.scrollX}>
            <Gantt
              tasks={visualTasks as any}
              viewMode={viewMode}
              locale="ja-JP"
              listCellWidth={`${listWidthPx}px`}
              columnWidth={48}
              rowHeight={40}
              TooltipContent={TooltipContent as any}
              onDateChange={(task: any) => {
                if (!task || task.id === 'virtual-root') return;
                const start = task.start instanceof Date ? task.start.toISOString().slice(0, 10) : undefined;
                const end = task.end instanceof Date ? task.end.toISOString().slice(0, 10) : undefined;
                setPendingDates(prev => ({ ...prev, [String(task.id)]: { startDate: start, endDate: end } }));
              }}
              onDoubleClick={(task: any) => {
                if (!task || task.id === 'virtual-root') return;
                setSelectedTaskId(task.id);
                const cur = items.find(t => t.id === task.id);
                if (!cur) return;
                setEditTitle(cur.title);
                setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                setEditProgress(typeof cur.progress === 'number' ? cur.progress : 0);
                setOpenEdit(true);
              }}
              onSelect={(task: any, isSelected: boolean) => {
                if (task?.id === 'virtual-root') {
                  setSelectedTaskId(null);
                  return;
                }
                setSelectedTaskId(isSelected ? task.id : null);
              }}
              TaskListHeader={({ headerHeight }: any) => (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    alignItems: 'center',
                    padding: '0 8px',
                    height: headerHeight,
                    boxSizing: 'border-box',
                    fontWeight: 600,
                    borderBottom: '1px solid #e0e0e0',
                    background: '#fafafa',
                  }}
                >
                  {[
                    { key: 'no', label: 'No' },
                    { key: 'assignee', label: '担当' },
                    { key: 'title', label: 'タスクの説明' },
                    { key: 'start', label: '開始日' },
                    { key: 'end', label: '終了日' },
                    { key: 'progress', label: '進捗' },
                  ].map((c, i) => (
                    <div key={c.key} style={{ borderRight: i < 5 ? '1px solid #eee' : undefined, paddingRight: 8, position: 'relative' }}>
                      {c.label}
                      {(['assignee','title','start','end'] as any).includes(c.key) && (
                        <div
                          onMouseDown={onResizeStart(c.key as keyof typeof colWidths)}
                          style={{ position: 'absolute', top: 0, right: -3, width: 6, height: '100%', cursor: 'col-resize' }}
                          aria-hidden
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              TaskListTable={({ tasks, rowHeight }: any) => (
                <div>
                  {tasks.map((t: any, idx: number) => {
                    if (t.id === '__range__') return null;
                    const appItem = items.find(it => it.id === t.id);
                    const assignee = appItem && appItem.assigneeUserId
                      ? participants.find(p => p.assigneeUserId === appItem.assigneeUserId || p.userId === appItem.assigneeUserId)
                      : null;
                    const isSel = selectedTaskId === t.id;
                    return (
                      <div
                        key={t.id ?? idx}
                        onClick={() => {
                          if (t.id !== 'virtual-root') setSelectedTaskId(prev => (prev === t.id ? null : t.id));
                        }}
                        onDoubleClick={() => {
                          if (t.id === 'virtual-root') return;
                          setSelectedTaskId(String(t.id));
                          const cur = items.find(x => x.id === t.id);
                          if (!cur) return;
                          setEditTitle(cur.title);
                          setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                          setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                          setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                          setEditProgress(typeof cur.progress === 'number' ? cur.progress : 0);
                          setOpenEdit(true);
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: gridCols,
                          alignItems: 'center',
                          padding: '0 8px',
                          height: rowHeight,
                          boxSizing: 'border-box',
                          background: isSel ? '#e3f2fd' : undefined,
                          cursor: t.id !== 'virtual-root' ? 'pointer' : 'default',
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, textAlign: 'left', fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>
                          {appItem?.numberPath ? displayTaskNumber(appItem.numberPath) : ''}
                        </div>
                        <div title={assignee?.displayName || assignee?.name || ''} style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>
                          {assignee?.displayName || assignee?.name || ''}
                        </div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400, textAlign: 'left' }}>
                          {t.name}
                        </div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{t.start?.toLocaleDateString?.() ?? ''}</div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{t.end?.toLocaleDateString?.() ?? ''}</div>
                        <div style={{ fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{typeof t.progress === 'number' ? `${t.progress}%` : ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            />
            {Object.keys(pendingDates).length > 0 && (
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Button size="small" variant="contained" onClick={async () => {
                  const entries = Object.entries(pendingDates);
                  for (const [id, patch] of entries) {
                    await update(id, { startDate: patch.startDate ?? null, endDate: patch.endDate ?? null });
                  }
                  setPendingDates({});
                }}>変更を反映</Button>
              </Box>
            )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 全画面オーバーレイ */}
      {fullScreen && (
        <Box className={styles.fullScreenOverlay}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1">ガントチャート（全画面）</Typography>
            <Box display="flex" gap={1}>
              <Button size="small" variant={viewMode === ViewMode.Month ? 'contained' : 'outlined'} onClick={() => setViewMode(ViewMode.Month)}>月</Button>
              <Button size="small" variant={viewMode === ViewMode.Week ? 'contained' : 'outlined'} onClick={() => setViewMode(ViewMode.Week)}>週</Button>
              <Button size="small" variant={viewMode === ViewMode.Day ? 'contained' : 'outlined'} onClick={() => setViewMode(ViewMode.Day)}>日</Button>
              <Button size="small" variant="contained" color="primary" onClick={() => setFullScreen(false)}>閉じる</Button>
            </Box>
          </Box>
          {/* 全画面用のボタンブロックA */}
          <Box display="flex" className={styles.toolbarA} justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" className={styles.toolbarA}>
              {ganttTasks.length === 0 && (
                <Button size="small" variant="outlined" onClick={() => { setTitle(''); setRootStart(''); setRootEnd(''); setOpenNew(true); }}>
                  最初のタスクを編集
                </Button>
              )}
              <Button size="small" variant="outlined" onClick={() => { setEditParticipants(participants); setOpenParticipants(true); }}>担当者</Button>
              <Button
                size="small"
                variant="contained"
                disabled={!selectedTaskId || !items.find(t => t.id === selectedTaskId && t.level === 1)}
                onClick={() => {
                  const parent = items.find(t => t.id === selectedTaskId);
                  if (!parent) return;
                  setChildParentId(parent.id);
                  setChildTitle('');
                  setChildAssigneeId(null);
                  setChildStart('');
                  setChildEnd('');
                  setOpenChild(true);
                }}
              >
                子タスク追加
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={!selectedTaskId}
                onClick={() => {
                  const cur = items.find(t => t.id === selectedTaskId);
                  if (!cur) return;
                  setEditTitle(cur.title);
                  setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                  setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                  setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                  setOpenEdit(true);
                }}
              >
                編集
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={!selectedTaskId}
                onClick={() => setOpenDelete1(true)}
              >
                削除
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {selectedTaskId ? '選択中: タスクID ' + selectedTaskId : 'クリックで選択 / もう一度で解除'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0 }} className={styles.scrollX}>
            <Gantt
              tasks={visualTasks as any}
              viewMode={viewMode}
              locale="ja-JP"
              listCellWidth={`${listWidthPx}px`}
              columnWidth={48}
              rowHeight={40}
              TooltipContent={TooltipContent as any}
              onDateChange={(task: any) => {
                if (!task || task.id === 'virtual-root') return;
                const start = task.start instanceof Date ? task.start.toISOString().slice(0, 10) : undefined;
                const end = task.end instanceof Date ? task.end.toISOString().slice(0, 10) : undefined;
                setPendingDates(prev => ({ ...prev, [String(task.id)]: { startDate: start, endDate: end } }));
              }}
              onDoubleClick={(task: any) => {
                if (!task || task.id === 'virtual-root') return;
                setSelectedTaskId(task.id);
                const cur = items.find(t => t.id === task.id);
                if (!cur) return;
                setEditTitle(cur.title);
                setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                setEditProgress(typeof cur.progress === 'number' ? cur.progress : 0);
                setOpenEdit(true);
              }}
              onSelect={(task: any, isSelected: boolean) => {
                if (task?.id === 'virtual-root') {
                  setSelectedTaskId(null);
                  return;
                }
                setSelectedTaskId(isSelected ? task.id : null);
              }}
              TaskListHeader={({ headerHeight }: any) => (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    alignItems: 'center',
                    padding: '0 8px',
                    height: headerHeight,
                    boxSizing: 'border-box',
                    fontWeight: 600,
                    borderBottom: '1px solid #e0e0e0',
                    background: '#fafafa',
                  }}
                >
                  {[
                    { key: 'no', label: 'No' },
                    { key: 'assignee', label: '担当' },
                    { key: 'title', label: 'タスクの説明' },
                    { key: 'start', label: '開始日' },
                    { key: 'end', label: '終了日' },
                    { key: 'progress', label: '進捗' },
                  ].map((c, i) => (
                    <div key={c.key} style={{ borderRight: i < 5 ? '1px solid #eee' : undefined, paddingRight: 8, position: 'relative' }}>
                      {c.label}
                      {(['assignee','title','start','end'] as any).includes(c.key) && (
                        <div
                          onMouseDown={onResizeStart(c.key as keyof typeof colWidths)}
                          style={{ position: 'absolute', top: 0, right: -3, width: 6, height: '100%', cursor: 'col-resize' }}
                          aria-hidden
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              TaskListTable={({ tasks, rowHeight }: any) => (
                <div>
                  {tasks.map((t: any, idx: number) => {
                    const appItem = items.find(it => it.id === t.id);
                    const assignee = appItem && appItem.assigneeUserId
                      ? participants.find(p => p.assigneeUserId === appItem.assigneeUserId || p.userId === appItem.assigneeUserId)
                      : null;
                    const isSel = selectedTaskId === t.id;
                    return (
                      <div
                        key={t.id ?? idx}
                        onClick={() => {
                          if (t.id !== 'virtual-root') setSelectedTaskId(prev => (prev === t.id ? null : t.id));
                        }}
                        onDoubleClick={() => {
                          if (t.id === 'virtual-root') return;
                          setSelectedTaskId(String(t.id));
                          const cur = items.find(x => x.id === t.id);
                          if (!cur) return;
                          setEditTitle(cur.title);
                          setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                          setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                          setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                          setEditProgress(typeof cur.progress === 'number' ? cur.progress : 0);
                          setOpenEdit(true);
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: gridCols,
                          alignItems: 'center',
                          padding: '0 8px',
                          height: rowHeight,
                          boxSizing: 'border-box',
                          background: isSel ? '#e3f2fd' : undefined,
                          cursor: t.id !== 'virtual-root' ? 'pointer' : 'default',
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, textAlign: 'left', fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>
                          {appItem?.numberPath ? displayTaskNumber(appItem.numberPath) : ''}
                        </div>
                        <div title={assignee?.displayName || assignee?.name || ''} style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>
                          {assignee?.displayName || assignee?.name || ''}
                        </div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400, textAlign: 'left' }}>
                          {t.name}
                        </div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{t.start?.toLocaleDateString?.() ?? ''}</div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{t.end?.toLocaleDateString?.() ?? ''}</div>
                        <div style={{ fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{typeof t.progress === 'number' ? `${t.progress}%` : ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            />
            {Object.keys(pendingDates).length > 0 && (
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Button size="small" variant="contained" onClick={async () => {
                  const entries = Object.entries(pendingDates);
                  for (const [id, patch] of entries) {
                    await update(id, { startDate: patch.startDate ?? null, endDate: patch.endDate ?? null });
                  }
                  setPendingDates({});
                }}>変更を反映</Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Dialog open={openNew} onClose={() => setOpenNew(false)}>
        <DialogTitle>最初のタスクを作成</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField autoFocus fullWidth label="タイトル" value={title} onChange={e => setTitle(e.target.value)} />
            <Box display="flex" gap={2}>
              <TextField type="date" label="From" value={rootStart} onChange={e => setRootStart(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="To" value={rootEnd} onChange={e => setRootEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField type="number" label="進捗(%)" value={rootProgress}
              onChange={e => setRootProgress(() => {
                const v = Number(e.target.value);
                if (Number.isNaN(v)) return 0;
                return Math.max(0, Math.min(100, Math.floor(v)));
              })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNew(false)}>キャンセル</Button>
          <Button variant="contained" onClick={addRoot}>追加</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openChild} onClose={() => setOpenChild(false)}>
        <DialogTitle>子タスク追加</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField autoFocus fullWidth label="タイトル" value={childTitle} onChange={e => setChildTitle(e.target.value)} />
            <Box display="flex" gap={2}>
              <TextField type="date" label="From" value={childStart} onChange={e => setChildStart(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="To" value={childEnd} onChange={e => setChildEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField type="number" label="進捗(%)" value={childProgress}
              onChange={e => setChildProgress(() => {
                const v = Number(e.target.value);
                if (Number.isNaN(v)) return 0;
                return Math.max(0, Math.min(100, Math.floor(v)));
              })}
              inputProps={{ min: 0, max: 100 }}
            />
            <Autocomplete
              options={[{ assigneeUserId: '', userId: null, name: '', displayName: '' } as ProjectParticipant, ...participants] as any}
              getOptionLabel={(o: ProjectParticipant) => o.displayName || o.name || ''}
              value={(participants as any).find((p: any) => p.assigneeUserId === (childAssigneeId ?? '') || p.userId === (childAssigneeId ?? '')) || null}
              isOptionEqualToValue={(opt: ProjectParticipant, val: ProjectParticipant) => opt.assigneeUserId === val.assigneeUserId}
              onChange={(_, v: ProjectParticipant | null) => setChildAssigneeId(v?.assigneeUserId || null)}
              renderInput={(params) => <TextField {...params} label="担当者" placeholder="（未選択可）" />}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChild(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!childParentId || !childTitle) return;
              await createChild(childParentId, {
                title: childTitle,
                assigneeUserId: childAssigneeId ?? undefined,
                startDate: childStart || undefined,
                endDate: childEnd || undefined,
                progress: childProgress,
              });
              setOpenChild(false);
            }}
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>タスクを編集</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="タイトル" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <Box display="flex" gap={2}>
              <TextField type="date" label="From" value={editStart} onChange={e => setEditStart(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="To" value={editEnd} onChange={e => setEditEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField type="number" label="進捗(%)" value={editProgress}
              onChange={e => setEditProgress(() => {
                const v = Number(e.target.value);
                if (Number.isNaN(v)) return 0;
                return Math.max(0, Math.min(100, Math.floor(v)));
              })}
              inputProps={{ min: 0, max: 100 }}
            />
            {(() => {
              const cur = items.find(t => t.id === selectedTaskId);
              if (!cur || cur.level === 1) return null;
              return (
                <Autocomplete
                  options={[{ assigneeUserId: '', userId: null, name: '', displayName: '' } as ProjectParticipant, ...participants] as any}
                  getOptionLabel={(o: ProjectParticipant) => o.displayName || o.name || ''}
                  value={(participants as any).find((p: any) => p.assigneeUserId === (editAssigneeId ?? '') || p.userId === (editAssigneeId ?? '')) || null}
                  isOptionEqualToValue={(opt: ProjectParticipant, val: ProjectParticipant) => opt.assigneeUserId === val.assigneeUserId}
                  onChange={(_, v: ProjectParticipant | null) => setEditAssigneeId(v?.assigneeUserId || null)}
                  renderInput={(params) => <TextField {...params} label="担当者" placeholder="（未選択可）" />}
                />
              );
            })()}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!selectedTaskId) return;
              const cur = items.find(t => t.id === selectedTaskId);
              if (!cur) return;
              await update(selectedTaskId, {
                title: editTitle,
                startDate: editStart || null,
                endDate: editEnd || null,
                assigneeUserId: cur.level === 1 ? undefined : (editAssigneeId ?? null),
                progress: editProgress,
              });
              setOpenEdit(false);
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認（1段目） */}
      <Dialog open={openDelete1} onClose={() => setOpenDelete1(false)}>
        <DialogTitle>確認</DialogTitle>
        <DialogContent>
          選択されたタスクを削除します。よろしいですか？
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete1(false)}>キャンセル</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setOpenDelete1(false);
              const cur = items.find(t => t.id === selectedTaskId);
              if (!cur) return;
              if (cur.level === 1) setOpenDelete2(true);
              else {
                // 子タスクは単独削除
                void (async () => {
                  await remove(cur.id);
                  setSelectedTaskId(null);
                })();
              }
            }}
          >削除</Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認（2段目, ルートのみ） */}
      <Dialog open={openDelete2} onClose={() => setOpenDelete2(false)}>
        <DialogTitle>確認</DialogTitle>
        <DialogContent>
          このタスク内のタスクも全て削除されます。本当によろしいですか？
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete2(false)}>キャンセル</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              const cur = items.find(t => t.id === selectedTaskId);
              if (!cur) { setOpenDelete2(false); return; }
              // ルート+配下を全削除（numberPath 前方一致で判定）
              const targets = items
                .filter(t => t.id === cur.id || t.numberPath.startsWith(cur.numberPath + '.'))
                .map(t => t.id);
              void (async () => {
                for (const id of targets) {
                  await remove(id);
                }
                setOpenDelete2(false);
                setSelectedTaskId(null);
              })();
            }}
          >削除</Button>
        </DialogActions>
      </Dialog>

      {/* 担当者CRUDダイアログ */}
      <Dialog open={openParticipants} onClose={() => setOpenParticipants(false)} maxWidth="md" fullWidth>
        <DialogTitle>担当者リスト編集</DialogTitle>
        <DialogContent>
          <Button size="small" onClick={() => setEditParticipants(p => [...p, { assigneeUserId: generateAssigneeId(), name: '', displayName: '' } as ProjectParticipant])}>担当者を追加</Button>
          <Stack spacing={1} mt={1}>
            {editParticipants.map((pt, i) => (
              <Box key={i} display="grid" gridTemplateColumns="1fr 1fr 1fr 80px 80px 80px" gap={1} alignItems="center">
                <TextField label="ユーザーID(任意)" value={pt.userId ?? ''} onChange={e => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, userId: e.target.value } : p))} size="small" />
                <TextField label="氏名" value={pt.name} onChange={e => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} size="small" />
                <TextField label="表示名" value={pt.displayName} onChange={e => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, displayName: e.target.value } : p))} size="small" />
                <Button size="small" variant={pt.canEdit ? 'contained' : 'outlined'} onClick={() => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, canEdit: !p.canEdit } : p))}>編集可</Button>
                <Button size="small" variant={pt.canView ? 'contained' : 'outlined'} onClick={() => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, canView: !p.canView } : p))}>閲覧可</Button>
                <Button size="small" color="error" onClick={() => setEditParticipants(prev => prev.filter((_, idx) => idx !== i))}>削除</Button>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenParticipants(false)}>キャンセル</Button>
          <Button
            onClick={async () => {
              if (!projectId) return;
              const updated = await saveParticipants(projectId, editParticipants);
              if (updated) {
                try {
                  const raw = JSON.parse(updated.participantsJson ?? '[]');
                  const normalized = (Array.isArray(raw) ? raw : []).map((x: any) => ({
                    assigneeUserId: x.assigneeUserId ?? generateAssigneeId(),
                    userId: x.userId ?? null,
                    name: x.name ?? '',
                    displayName: x.displayName ?? x.name ?? '',
                    canEdit: !!x.canEdit,
                    canView: !!x.canView,
                  })) as ProjectParticipant[];
                  setParticipants(normalized);
                } catch {
                  // ignore
                }
              }
              setOpenParticipants(false);
            }}
            variant="contained"
          >保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

