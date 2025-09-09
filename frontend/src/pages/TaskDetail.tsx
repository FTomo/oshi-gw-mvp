import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, Autocomplete, IconButton } from '@mui/material';
import styles from './TaskDetail.module.css';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useTask } from '../hooks/useTask';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import type { ProjectParticipant } from '../services/projectService';
import { generateAssigneeId } from '../services/projectService';
import { displayTaskNumber } from '../services/taskService';
import { userService } from '../services/userService';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export default function TaskDetail() {
  const { projectId } = useParams();
  const { getById, me, saveParticipants } = useProject();
  const { items, loadByProject, createRoot, createChild, update, remove, move, ganttTasks } = useTask(projectId);

  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [canEditProject, setCanEditProject] = useState<boolean>(false); // 権限制御用
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month); // ボタンブロックB: 月/週/日
  const [fullScreen, setFullScreen] = useState(false); // ボタンブロックB: 全画面
  const [openParticipants, setOpenParticipants] = useState(false);
  const [editParticipants, setEditParticipants] = useState<ProjectParticipant[]>([]);
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

  // 並び替えボタンの有効/無効（選択・スコープ・端判定）
  const { canMoveUp, canMoveDown } = React.useMemo(() => {
    if (!selectedTaskId) return { canMoveUp: false, canMoveDown: false };
    const target = items.find(t => t.id === selectedTaskId);
    if (!target) return { canMoveUp: false, canMoveDown: false };
    if (!target.parentTaskId) {
      // ルート同士
      const roots = items.filter(t => !t.parentTaskId).sort((a, b) => a.sequence - b.sequence);
      const idx = roots.findIndex(t => t.id === target.id);
      return { canMoveUp: idx > 0, canMoveDown: idx >= 0 && idx < roots.length - 1 };
    } else {
      // 同一ルート配下の同階層・同親の中で
      let p = target as any;
      while (p && p.parentTaskId) p = items.find(t => t.id === p.parentTaskId);
      const root = p;
      if (!root) return { canMoveUp: false, canMoveDown: false };
      const siblings = items
        .filter(t => t.numberPath.startsWith(root.numberPath + '.') && t.level === target.level && t.parentTaskId === target.parentTaskId)
        .sort((a, b) => a.sequence - b.sequence);
      const idx = siblings.findIndex(t => t.id === target.id);
      return { canMoveUp: idx > 0, canMoveDown: idx >= 0 && idx < siblings.length - 1 };
    }
  }, [items, selectedTaskId]);

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
              email: x.email ?? null,
              name: x.name ?? '',
              displayName: x.displayName ?? x.name ?? '',
              canEdit: !!x.canEdit,
              canView: !!x.canView,
            })) as ProjectParticipant[];
            // 自身をデフォルトでリストに含める（DB未保存でも選択可能にする）
            const meSub = me?.sub;
            const existsSelf = meSub ? normalized.some(pt => pt.userId === meSub || pt.assigneeUserId === meSub) : false;
            if (meSub && !existsSelf) {
              const selfRow: ProjectParticipant = {
                assigneeUserId: meSub, // 安定IDとして自分の userId を利用
                userId: meSub,
                name: me?.name ?? '',
                displayName: me?.name ?? '',
                canEdit: true,
                canView: true,
              };
              setParticipants([...normalized, selfRow]);
            } else {
              setParticipants(normalized);
            }
          } catch {
            setParticipants([]);
          }
        } else {
          // 参加者未設定でも自分を表示可能にする
          const meSub = me?.sub;
          if (meSub) {
            setParticipants([{ assigneeUserId: meSub, userId: meSub, email: me?.email ?? null, name: me?.name ?? '', displayName: me?.name ?? '', canEdit: true, canView: true }]);
          } else {
            setParticipants([]);
          }
        }
        // 権限制御: 自分が manager か participantsJson 内で canEdit=true か editableUserIdsJson に含まれるか
        try {
          const mySub = me?.sub;
          if (p && mySub) {
            if (p.managerUserId === mySub) {
              setCanEditProject(true);
            } else {
              let editableFlag = false;
              try {
                const editableArr: string[] = JSON.parse(p.editableUserIdsJson ?? '[]');
                if (Array.isArray(editableArr) && editableArr.includes(mySub)) editableFlag = true;
              } catch { /* ignore */ }
              if (!editableFlag && p.participantsJson) {
                try {
                  const arr: any[] = JSON.parse(p.participantsJson);
                  if (Array.isArray(arr)) {
                    editableFlag = arr.some(x => (x?.userId === mySub || x?.assigneeUserId === mySub) && x?.canEdit === true);
                  }
                } catch { /* ignore */ }
              }
              setCanEditProject(editableFlag);
            }
          } else {
            setCanEditProject(false);
          }
        } catch { setCanEditProject(false); }
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
      return ganttTasks.map(gt => ({
        ...gt,
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
      }));
    }
    // タスクがない場合の仮想ルート（ガント側の UI を保つため）
    const today = new Date();
    return [
      {
        id: 'virtual-root',
        type: 'project',
        name: 'タスクなし',
        start: today,
        end: today,
        progress: 0,
        hideChildren: true,
        // 視覚的には非表示にする
        styles: {
          backgroundColor: 'transparent',
          backgroundSelectedColor: 'transparent',
          progressColor: 'transparent',
          progressSelectedColor: 'transparent',
        },
      },
    ] as any[];
  }, [ganttTasks]);

  // ツールチップ（カーソルから少しずらす）
  const TooltipContent = React.useCallback(({ task }: { task: any }) => {
    if (!task || task.id === 'virtual-root') return null;
    const start = task.start?.toLocaleDateString?.() ?? '';
    const end = task.end?.toLocaleDateString?.() ?? '';
    return (
      <div
        style={{
          transform: 'translate(12px, 12px)',
          pointerEvents: 'none',
          background: 'rgba(33,33,33,0.9)',
          color: '#fff',
          padding: '6px 8px',
          borderRadius: 4,
          fontSize: 12,
          maxWidth: 260,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{task.name}</div>
        <div>開始: {start}</div>
        <div>終了: {end}</div>
        {typeof task.progress === 'number' ? <div>進捗: {task.progress}%</div> : null}
      </div>
    );
  }, []);

  // タスクが無い場合はツールチップ自体を無効化（黄色い三角の吹き出しを抑止）
  const DisabledTooltip = React.useCallback(() => null, []);
  const tooltipComp = ganttTasks.length === 0 ? (DisabledTooltip as any) : (TooltipContent as any);

  return (
    <Box className={styles.taskDetail}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">プロジェクト: {projectName}</Typography>
  <Button variant="contained" disabled={!canEditProject} onClick={() => { setTitle(''); setRootStart(''); setRootEnd(''); setOpenNew(true); }}>ルートタスク追加</Button>
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
              <Button size="small" variant="outlined" disabled={!canEditProject} onClick={() => {
                setEditParticipants(participants);
                setOpenParticipants(true);
              }}>担当者</Button>
              <Button
                size="small"
                variant="contained"
                disabled={!canEditProject || !selectedTaskId || !items.find(t => t.id === selectedTaskId && t.level === 1)}
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
                disabled={!canEditProject || !selectedTaskId}
                onClick={() => {
                  const cur = items.find(t => t.id === selectedTaskId);
                  if (!cur) return;
                  setEditTitle(cur.title);
                  setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                  setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                  setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                  setEditProgress(typeof cur.progress === 'number' ? cur.progress : 0);
                  setOpenEdit(true);
                }}
              >
                編集
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={!canEditProject || !selectedTaskId}
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
              TooltipContent={tooltipComp}
              onDateChange={(task: any) => {
                if (!task || task.id === 'virtual-root') return;
                const start = task.start instanceof Date ? task.start.toISOString().slice(0, 10) : null;
                const end = task.end instanceof Date ? task.end.toISOString().slice(0, 10) : null;
                void update(String(task.id), { startDate: start, endDate: end });
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
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, textAlign: 'left', fontWeight: appItem?.level === 1 ? 600 as any : 400, position: 'relative', paddingLeft: 0 }}>
                          {isSel && (
                            <div className={styles.reorderControl} onMouseDown={(e) => e.stopPropagation()}>
                              <IconButton
                                size="small"
                                sx={{ p: 0.25, visibility: canMoveUp ? 'visible' : 'hidden' }}
                                onClick={(e) => { e.stopPropagation(); if (selectedTaskId) void move(selectedTaskId, 'up'); }}
                                aria-hidden={!canMoveUp}
                                disabled={!canMoveUp}
                              >
                                <ArrowDropUpIcon sx={{ fontSize: 48, color: '#000' }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ p: 0.25, visibility: canMoveDown ? 'visible' : 'hidden' }}
                                onClick={(e) => { e.stopPropagation(); if (selectedTaskId) void move(selectedTaskId, 'down'); }}
                                aria-hidden={!canMoveDown}
                                disabled={!canMoveDown}
                              >
                                <ArrowDropDownIcon sx={{ fontSize: 48, color: '#000' }} />
                              </IconButton>
                            </div>
                          )}
                          {appItem?.numberPath ? displayTaskNumber(appItem.numberPath) : ''}
                        </div>
                        <div title={assignee?.displayName || assignee?.name || ''} style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>
                          {assignee?.displayName || assignee?.name || ''}
                        </div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400, textAlign: 'left' }}>
                          {t.name}
                        </div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{t.id === 'virtual-root' ? '' : (t.start?.toLocaleDateString?.() ?? '')}</div>
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{t.id === 'virtual-root' ? '' : (t.end?.toLocaleDateString?.() ?? '')}</div>
                        <div style={{ fontWeight: appItem?.level === 1 ? 600 as any : 400 }}>{typeof t.progress === 'number' ? `${t.progress}%` : ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            />
            {/* 変更を反映ボタンは廃止（ドラッグ時点で即保存） */}
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
                <Button size="small" variant="outlined" disabled={!canEditProject} onClick={() => { setTitle(''); setRootStart(''); setRootEnd(''); setOpenNew(true); }}>
                  最初のタスクを編集
                </Button>
              )}
              <Button size="small" variant="outlined" disabled={!canEditProject} onClick={() => {
                setEditParticipants(participants);
                setOpenParticipants(true);
              }}>担当者</Button>
              <Button
                size="small"
                variant="contained"
                disabled={!canEditProject || !selectedTaskId || !items.find(t => t.id === selectedTaskId && t.level === 1)}
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
                disabled={!canEditProject || !selectedTaskId}
                onClick={() => {
                  const cur = items.find(t => t.id === selectedTaskId);
                  if (!cur) return;
                  setEditTitle(cur.title);
                  setEditStart(cur.startDate ? String(cur.startDate).slice(0, 10) : '');
                  setEditEnd(cur.endDate ? String(cur.endDate).slice(0, 10) : '');
                  setEditAssigneeId(cur.level === 1 ? null : (cur.assigneeUserId ?? null));
                  setEditProgress(typeof cur.progress === 'number' ? cur.progress : 0);
                  setOpenEdit(true);
                }}
              >
                編集
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={!canEditProject || !selectedTaskId}
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
                const start = task.start instanceof Date ? task.start.toISOString().slice(0, 10) : null;
                const end = task.end instanceof Date ? task.end.toISOString().slice(0, 10) : null;
                void update(String(task.id), { startDate: start, endDate: end });
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
                        <div style={{ borderRight: '1px solid #eee', paddingRight: 8, textAlign: 'left', fontWeight: appItem?.level === 1 ? 600 as any : 400, position: 'relative', paddingLeft: 0 }}>
                          {isSel && (
                            <div className={styles.reorderControl} onMouseDown={(e) => e.stopPropagation()}>
                              <IconButton
                                size="small"
                                sx={{ p: 0.25, visibility: canMoveUp ? 'visible' : 'hidden' }}
                                onClick={(e) => { e.stopPropagation(); if (selectedTaskId) void move(selectedTaskId, 'up'); }}
                                aria-hidden={!canMoveUp}
                                disabled={!canMoveUp}
                              >
                                <ArrowDropUpIcon sx={{ fontSize: 48, color: '#000' }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ p: 0.25, visibility: canMoveDown ? 'visible' : 'hidden' }}
                                onClick={(e) => { e.stopPropagation(); if (selectedTaskId) void move(selectedTaskId, 'down'); }}
                                aria-hidden={!canMoveDown}
                                disabled={!canMoveDown}
                              >
                                <ArrowDropDownIcon sx={{ fontSize: 48, color: '#000' }} />
                              </IconButton>
                            </div>
                          )}
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
            {/* 変更を反映ボタンは廃止（ドラッグ時点で即保存） */}
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
          <Button size="small" onClick={() => setEditParticipants(p => [...p, { assigneeUserId: generateAssigneeId(), email: '', name: '', displayName: '' } as ProjectParticipant])}>担当者を追加</Button>
          <Stack spacing={1} mt={1}>
            {editParticipants.map((pt, i) => (
              <Box key={i} display="grid" gridTemplateColumns="1fr 1fr 1fr 80px 80px 80px" gap={1} alignItems="center">
        {(() => {
                  const isSelf = !!me?.sub && (pt.userId === me.sub || pt.assigneeUserId === me.sub);
                  return (
                    <>
          <TextField label="メールアドレス" value={pt.email ?? ''} onChange={e => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, email: e.target.value } : p))} size="small" disabled={isSelf} placeholder="user@example.com" />
                      <TextField label="氏名" value={pt.name} onChange={e => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} size="small" />
                      <TextField label="表示名" value={pt.displayName} onChange={e => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, displayName: e.target.value } : p))} size="small" />
                      <Button
                        size="small"
                        variant={pt.canEdit ? 'contained' : 'outlined'}
                        onClick={() => setEditParticipants(prev => prev.map((p, idx) => {
                          if (idx !== i) return p;
                          const next = { ...p, canEdit: !p.canEdit } as ProjectParticipant;
                          if (next.canEdit) next.canView = true; // 編集可ON時は閲覧可もON
                          return next;
                        }))}
                        disabled={isSelf}
                      >編集可</Button>
                      <Button
                        size="small"
                        variant={pt.canView ? 'contained' : 'outlined'}
                        onClick={() => setEditParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, canView: !p.canView } : p))}
                        disabled={isSelf}
                      >閲覧可</Button>
                      <Button size="small" color="error" onClick={() => setEditParticipants(prev => prev.filter((_, idx) => idx !== i))} disabled={isSelf}>削除</Button>
                    </>
                  );
                })()}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenParticipants(false)}>キャンセル</Button>
          <Button
            onClick={async () => {
              if (!projectId) return;
              const meSub = me?.sub;
              // 自身の行を検出
              const selfIdx = editParticipants.findIndex(pt => pt.userId === meSub || pt.assigneeUserId === meSub);
              let payload = [...editParticipants];
              if (selfIdx >= 0) {
                const selfRow = editParticipants[selfIdx];
                // 自身の行は氏名・表示名のみ保存対象。他項目は据え置き（DB未保存で初登場のケースも含む）
                const base = participants.find(pt => pt.userId === meSub || pt.assigneeUserId === meSub) ?? null;
                const merged = {
                  ...(base ?? selfRow),
                  // 保存は name/displayName のみ反映
                  name: selfRow.name,
                  displayName: selfRow.displayName,
                } as ProjectParticipant;
                payload[selfIdx] = merged;
              }
              // メールアドレスからユーザーIDを補完
              try {
                const { items: users } = await userService.list(200);
                const byEmail = new Map(users.map(u => [u.email?.toLowerCase?.() ?? '', u]));
                payload = payload.map(p => {
                  if (p.email && !p.userId) {
                    const u = byEmail.get(p.email.toLowerCase());
                    if (u) {
                      return {
                        ...p,
                        userId: u.id,
                        name: p.name || u.name || '',
                        displayName: p.displayName || u.name || '',
                      } as ProjectParticipant;
                    }
                  }
                  return p;
                });
              } catch {
                // ユーザー取得に失敗しても保存は進める
              }
              const updated = await saveParticipants(projectId, payload);
              if (updated) {
                try {
                  const raw = JSON.parse(updated.participantsJson ?? '[]');
                  const normalized = (Array.isArray(raw) ? raw : []).map((x: any) => ({
                    assigneeUserId: x.assigneeUserId ?? generateAssigneeId(),
                    userId: x.userId ?? null,
                    email: x.email ?? null,
                    name: x.name ?? '',
                    displayName: x.displayName ?? x.name ?? '',
                    canEdit: !!x.canEdit,
                    canView: !!x.canView,
                  })) as ProjectParticipant[];
                  setParticipants(() => {
                    // 自分がDBに未保存だった場合、今回の保存でDBに載る
                    return normalized;
                  });
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

