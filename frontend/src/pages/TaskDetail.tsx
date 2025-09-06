import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, Autocomplete } from '@mui/material';
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
  const [openParticipants, setOpenParticipants] = useState(false);
  const [editParticipants, setEditParticipants] = useState<ProjectParticipant[]>([]);

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
      return ganttTasks.map(gt => {
        const isSel = selectedTaskId === gt.id;
        return {
          ...gt,
          // 左ペインで担当列を別表示するため、name は純粋な説明のみ
          name: gt.name,
          styles: {
            ...(gt as any).styles,
            backgroundColor: isSel ? '#e3f2fd' : (gt as any).styles?.backgroundColor,
            backgroundSelectedColor: '#bbdefb',
            progressColor: '#1976d2',
            progressSelectedColor: '#1565c0',
          },
        } as any;
      });
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
  }, [ganttTasks, items, participants, projectId, selectedTaskId]);

  return (
    <Box>
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
            <Box display="flex" gap={1}>
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

          {!loading && (
            <Gantt
              tasks={visualTasks as any}
              viewMode={ViewMode.Month}
              locale="ja-JP"
              listCellWidth={"740px"}
              columnWidth={48}
              rowHeight={40}
              onDateChange={() => { /* 後続で日付変更による更新を実装 */ }}
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
                    gridTemplateColumns: '60px 80px 320px 120px 120px 40px',
                    alignItems: 'center',
                    padding: '0 8px',
                    height: headerHeight,
                    boxSizing: 'border-box',
                    fontWeight: 600,
                    borderBottom: '1px solid #e0e0e0',
                    background: '#fafafa',
                  }}
                >
                  <div style={{ borderRight: '1px solid #eee', paddingRight: 8 }}>No</div>
                  <div style={{ borderRight: '1px solid #eee', paddingRight: 8 }}>担当</div>
                  <div style={{ borderRight: '1px solid #eee', paddingRight: 8 }}>タスクの説明</div>
                  <div style={{ borderRight: '1px solid #eee', paddingRight: 8 }}>開始日</div>
                  <div style={{ borderRight: '1px solid #eee', paddingRight: 8 }}>終了日</div>
                  <div>進捗</div>
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
                          gridTemplateColumns: '60px 80px 320px 120px 120px 40px',
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
          )}
        </CardContent>
      </Card>

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

