import { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useProject } from '../hooks/useProject';
import { type ProjectParticipant, generateAssigneeId } from '../services/projectService';
import { useUser } from '../hooks/useUser';
import { userService } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';

export default function ProjectList() {
	const { me } = useUser();
	const { items, list, create, saveParticipants } = useProject();
		const nav = useNavigate();
	const [openNew, setOpenNew] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDesc, setNewDesc] = useState('');
	const [editTargetId, setEditTargetId] = useState<string | null>(null);
	const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
	// 削除ダイアログ用 state
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; ownerName: string; isOwner: boolean } | null>(null);
	const [confirmOwnerStep, setConfirmOwnerStep] = useState(false);
	const [confirmName, setConfirmName] = useState('');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			if (!me?.sub) { if (mounted) setIsAdmin(false); return; }
			const u = await userService.getById(me.sub);
			if (mounted) setIsAdmin((u?.role ?? '') === 'admin');
		})();
		return () => { mounted = false };
	}, [me?.sub]);

	useEffect(() => { void list(); }, [list]);

	const isParticipant = (p: any) => {
		if (!me?.sub) return false;
		// participantsJson に自分が含まれるか
		try {
			const raw: any[] = p.participantsJson ? JSON.parse(p.participantsJson) : [];
			if (Array.isArray(raw)) {
				if (raw.some((x: any) => x?.userId === me.sub || x?.assigneeUserId === me.sub)) return true;
			}
		} catch { /* ignore */ }
		// editable/readable に自分が含まれるか
		try {
			const edit: string[] = JSON.parse(p.editableUserIdsJson ?? '[]');
			const read: string[] = JSON.parse(p.readableUserIdsJson ?? '[]');
			if (Array.isArray(edit) && edit.includes(me.sub)) return true;
			if (Array.isArray(read) && read.includes(me.sub)) return true;
		} catch { /* ignore */ }
		return false;
	};

	const createdByMe = me ? items.filter(p => p.managerUserId === me.sub) : items;
	const participating = me ? items.filter(p => p.managerUserId !== me.sub && isParticipant(p)) : [];

	const openParticipantDialog = (pid: string, currentJson?: string | null) => {
		setEditTargetId(pid);
			const raw: any[] = currentJson ? JSON.parse(currentJson) : [];
						const arr: ProjectParticipant[] = (Array.isArray(raw) ? raw : []).map((p: any) => ({
				assigneeUserId: p.assigneeUserId ?? generateAssigneeId(),
							userId: p.userId ?? p.id ?? null,
							email: p.email ?? null,
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
			// メールアドレスからユーザーを解決（存在すれば userId に反映）
			const resolved = await (async () => {
				try {
					const { items: users } = await userService.list(200);
					const byEmail = new Map(users.map(u => [u.email?.toLowerCase?.() ?? '', u]));
					return participants.map(p => {
						if (p.email && !p.userId) {
							const u = byEmail.get(p.email.toLowerCase());
							if (u) return { ...p, userId: u.id, name: p.name || u.name || '', displayName: p.displayName || u.name || '' } as ProjectParticipant;
						}
						return p;
					});
				} catch {
					return participants;
				}
			})();
			await saveParticipants(editTargetId, resolved);
		setEditTargetId(null);
	};

	const openDeleteFlow = async (p: any) => {
		let ownerName = '不明ユーザー';
		const isOwner = !!me?.sub && p.managerUserId === me.sub;
		if (isOwner) {
			ownerName = me?.name || me?.email || '自分';
		} else if (p.managerUserId) {
			try {
				const u = await userService.getById(p.managerUserId);
				ownerName = u?.name || u?.email || p.managerUserId;
			} catch { /* ignore */ }
		}
		setDeleteTarget({ id: p.id, name: p.name, ownerName, isOwner });
		setConfirmOwnerStep(isAdmin && !isOwner); // 管理者が他人の作成物を削除する時のみ第1段
		setConfirmName('');
	};

	const canDeleteProject = (p: any) => {
		const isOwner = !!me?.sub && p.managerUserId === me.sub;
		return isOwner || isAdmin;
	};

	const performDelete = async () => {
		if (!deleteTarget) return;
		// プロジェクト名完全一致が必要
		if (confirmName !== deleteTarget.name) return;
		// 実際の削除
		const ok = await projectService.remove(deleteTarget.id);
		if (ok) {
			// ローカル一覧から除外
			// 直接 setItems は useProject 内部 state のため使えないので、list を再取得
			await list();
		}
		setDeleteTarget(null);
		setConfirmOwnerStep(false);
		setConfirmName('');
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h5">プロジェクト一覧</Typography>
				<Button variant="contained" onClick={() => setOpenNew(true)}>新規作成</Button>
			</Box>
			{me ? (
				<Stack spacing={3}>
					<Box>
						<Typography variant="subtitle2" gutterBottom>自分が作成</Typography>
						<Stack spacing={2}>
							{createdByMe.length === 0 ? (
								<Typography variant="body2" color="text.secondary">該当なし</Typography>
							) : createdByMe.map(p => (
								<Card key={p.id}>
									<CardActionArea onClick={() => nav(`/projects/${p.id}`)}>
										<CardContent>
											<Box display="flex" justifyContent="space-between" alignItems="center">
												<Box>
													<Typography variant="subtitle1">{p.name}</Typography>
													<Typography variant="caption" color="text.secondary">{p.description || ''}</Typography>
												</Box>
												<Box display="flex" gap={1} alignItems="center">
													<Chip size="small" label="作成者" color="primary" variant="outlined" />
													<Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openParticipantDialog(p.id, p.participantsJson); }}>担当者</Button>
													{canDeleteProject(p) && (
														<Button size="small" color="error" onClick={(e) => { e.stopPropagation(); openDeleteFlow(p); }}>削除</Button>
													)}
												</Box>
											</Box>
										</CardContent>
									</CardActionArea>
								</Card>
							))}
						</Stack>
					</Box>

					<Box>
						<Typography variant="subtitle2" gutterBottom>担当者として参加</Typography>
						<Stack spacing={2}>
							{participating.length === 0 ? (
								<Typography variant="body2" color="text.secondary">該当なし</Typography>
							) : participating.map(p => (
								<Card key={p.id}>
									<CardActionArea onClick={() => nav(`/projects/${p.id}`)}>
										<CardContent>
											<Box display="flex" justifyContent="space-between" alignItems="center">
												<Box>
													<Typography variant="subtitle1">{p.name}</Typography>
													<Typography variant="caption" color="text.secondary">{p.description || ''}</Typography>
												</Box>
												<Box display="flex" gap={1} alignItems="center">
													<Chip size="small" label="担当者" color="default" variant="outlined" />
													<Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openParticipantDialog(p.id, p.participantsJson); }}>担当者</Button>
													{canDeleteProject(p) && (
														<Button size="small" color="error" onClick={(e) => { e.stopPropagation(); openDeleteFlow(p); }}>削除</Button>
													)}
												</Box>
											</Box>
										</CardContent>
									</CardActionArea>
								</Card>
							))}
						</Stack>
					</Box>
				</Stack>
			) : (
				// me がまだ同期されていない場合は従来通りまとめて表示
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
			)}

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
									<Box key={i} display="grid" gridTemplateColumns="1.2fr 1fr 1fr 80px 80px 80px" gap={1} alignItems="center">
										<TextField label="メールアドレス" value={pt.email ?? ''} onChange={e => updateParticipant(i, 'email', e.target.value)} size="small" placeholder="user@example.com" />
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
		{/* 削除確認 第1段（管理者が他人作成物を消す時） */}
		<Dialog open={!!deleteTarget && confirmOwnerStep} onClose={() => { setConfirmOwnerStep(false); setDeleteTarget(null); }}>
			<DialogTitle>確認</DialogTitle>
			<DialogContent>
				{deleteTarget && (
					<Typography>
						{deleteTarget.ownerName} さんが作成したプロジェクトです。本当に削除しますか？
					</Typography>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => { setConfirmOwnerStep(false); setDeleteTarget(null); }}>キャンセル</Button>
				<Button color="error" variant="contained" onClick={() => setConfirmOwnerStep(false)}>続行</Button>
			</DialogActions>
		</Dialog>

		{/* 削除確認 第2段（名前入力必須） */}
		<Dialog open={!!deleteTarget && !confirmOwnerStep} onClose={() => { setDeleteTarget(null); setConfirmName(''); }} maxWidth="xs" fullWidth>
			<DialogTitle>プロジェクトの削除</DialogTitle>
			<DialogContent>
				{deleteTarget && (
					<Stack spacing={2} mt={1}>
						<Typography>この操作は取り消せません。続行するには、プロジェクト名を入力してください。</Typography>
						<TextField label="プロジェクト名" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} fullWidth />
					</Stack>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => { setDeleteTarget(null); setConfirmName(''); }}>キャンセル</Button>
				<Button color="error" variant="contained" disabled={!deleteTarget || confirmName !== deleteTarget.name} onClick={performDelete}>削除</Button>
			</DialogActions>
		</Dialog>

		</Box>
	);
}

// 削除確認ダイアログ（段階式）はコンポーネント末尾に設置（JSXのトップではなく return 内に入れても良いが簡略化）

