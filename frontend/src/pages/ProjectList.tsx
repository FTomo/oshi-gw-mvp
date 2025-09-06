import { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useProject } from '../hooks/useProject';
import { type ProjectParticipant, generateAssigneeId } from '../services/projectService';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

export default function ProjectList() {
	const { me } = useUser();
	const { items, list, create, saveParticipants } = useProject();
		const nav = useNavigate();
	const [openNew, setOpenNew] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDesc, setNewDesc] = useState('');
	const [editTargetId, setEditTargetId] = useState<string | null>(null);
	const [participants, setParticipants] = useState<ProjectParticipant[]>([]);

	useEffect(() => { void list(); }, [list]);

	const openParticipantDialog = (pid: string, currentJson?: string | null) => {
		setEditTargetId(pid);
			const raw: any[] = currentJson ? JSON.parse(currentJson) : [];
			const arr: ProjectParticipant[] = (Array.isArray(raw) ? raw : []).map((p: any) => ({
				assigneeUserId: p.assigneeUserId ?? generateAssigneeId(),
				userId: p.userId ?? p.id ?? null,
				name: p.name ?? '',
				displayName: p.displayName ?? p.name ?? '',
				canEdit: !!p.canEdit,
				canView: !!p.canView,
			}));
			setParticipants(arr);
	};

		const addParticipant = () => setParticipants(p => [...p, { assigneeUserId: generateAssigneeId(), name: '', displayName: '' } as ProjectParticipant]);
	const updateParticipant = (i: number, field: keyof ProjectParticipant, val: string | boolean) =>
		setParticipants(prev => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
	const removeParticipant = (i: number) => setParticipants(prev => prev.filter((_, idx) => idx !== i));

	const submitNew = async () => {
		if (!me) return;
		const created = await create({
			name: newName,
			description: newDesc,
			managerUserId: me.sub,
			startDate: null,
			endDate: null,
			participantsJson: JSON.stringify([]),
			editableUserIdsJson: JSON.stringify([]),
			readableUserIdsJson: JSON.stringify([]),
		} as any);
		if (created) setOpenNew(false);
	};

	const submitParticipants = async () => {
		if (!editTargetId) return;
		await saveParticipants(editTargetId, participants);
		setEditTargetId(null);
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h5">プロジェクト一覧</Typography>
				<Button variant="contained" onClick={() => setOpenNew(true)}>新規作成</Button>
			</Box>
			<Stack spacing={2}>
						{items.map(p => (
							<Card key={p.id}>
								<CardActionArea onClick={() => nav(`/projects/${p.id}`)}>
									<CardContent>
										<Box display="flex" justifyContent="space-between" alignItems="center">
											<Box>
												<Typography variant="subtitle1">{p.name}</Typography>
												<Typography variant="caption" color="text.secondary">{p.description || ''}</Typography>
											</Box>
											<Box display="flex" gap={1}>
												<Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openParticipantDialog(p.id, p.participantsJson); }}>担当者</Button>
											</Box>
										</Box>
									</CardContent>
								</CardActionArea>
							</Card>
						))}
			</Stack>

			<Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
				<DialogTitle>新規プロジェクト</DialogTitle>
				<DialogContent>
					<Stack spacing={2} mt={1}>
						<TextField label="名称" value={newName} onChange={e => setNewName(e.target.value)} fullWidth />
						<TextField label="説明" value={newDesc} onChange={e => setNewDesc(e.target.value)} fullWidth multiline minRows={3} />
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenNew(false)}>キャンセル</Button>
					<Button onClick={submitNew} variant="contained">作成</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={!!editTargetId} onClose={() => setEditTargetId(null)} maxWidth="md" fullWidth>
				<DialogTitle>担当者リスト編集</DialogTitle>
				<DialogContent>
					<Button size="small" onClick={addParticipant}>担当者を追加</Button>
					<Stack spacing={1} mt={1}>
						{participants.map((pt, i) => (
							<Box key={i} display="grid" gridTemplateColumns="1fr 1fr 1fr 80px 80px 80px" gap={1} alignItems="center">
								<TextField label="ユーザーID(任意)" value={pt.userId ?? ''} onChange={e => updateParticipant(i, 'userId', e.target.value)} size="small" />
								<TextField label="氏名" value={pt.name} onChange={e => updateParticipant(i, 'name', e.target.value)} size="small" />
								<TextField label="表示名" value={pt.displayName} onChange={e => updateParticipant(i, 'displayName', e.target.value)} size="small" />
								<Button size="small" variant={pt.canEdit ? 'contained' : 'outlined'} onClick={() => updateParticipant(i, 'canEdit', !pt.canEdit)}>編集可</Button>
								<Button size="small" variant={pt.canView ? 'contained' : 'outlined'} onClick={() => updateParticipant(i, 'canView', !pt.canView)}>閲覧可</Button>
								<Button size="small" color="error" onClick={() => removeParticipant(i)}>削除</Button>
							</Box>
						))}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditTargetId(null)}>キャンセル</Button>
					<Button onClick={submitParticipants} variant="contained">保存</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

