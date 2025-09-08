import { useCallback, useState } from 'react';
import { projectService, type DbProject, type ProjectParticipant } from '../services/projectService';
import { useUser } from './useUser';

export function useProject() {
	const { me } = useUser();
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState<DbProject[]>([]);

	const list = useCallback(async () => {
		setLoading(true);
		try {
			const res = await projectService.list(200);
			// 権限: admin は全件, それ以外は managerUserId==me.sub か editableUserIdsJson/readableUserIdsJson に含まれる
			const mySub = me?.sub;
			const myEmail = me?.email?.toLowerCase?.();
			const isAdmin = false; // 将来: me.role==='admin' 等
			const filtered = res.items.filter(p => {
				if (isAdmin) return true;
				if (!mySub) return false;
				if (p.managerUserId === mySub) return true;
				const editable: string[] = JSON.parse(p.editableUserIdsJson ?? '[]');
				const readable: string[] = JSON.parse(p.readableUserIdsJson ?? '[]');
				if (editable.includes(mySub) || readable.includes(mySub)) return true;
				// participantsJson に自分が含まれていれば表示対象（userId / assigneeUserId / email で判定）
				try {
					const arr: any[] = p.participantsJson ? JSON.parse(p.participantsJson) : [];
					if (Array.isArray(arr)) {
						return arr.some((x: any) => x?.userId === mySub || x?.assigneeUserId === mySub || (!!myEmail && (x?.email?.toLowerCase?.() === myEmail)));
					}
				} catch { /* ignore */ }
				return false;
			});
			setItems(filtered);
			return filtered;
		} finally {
			setLoading(false);
		}
	}, [me]);

	const create = useCallback(async (input: Omit<DbProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
		const created = await projectService.create(input);
		if (created) setItems(prev => [created!, ...prev]);
		return created;
	}, []);

	const update = useCallback(async (id: string, patch: Partial<Omit<DbProject, 'id' | 'managerUserId'>>) => {
		const updated = await projectService.update(id, patch);
		if (updated) setItems(prev => prev.map(p => (p.id === id ? updated : p)));
		return updated;
	}, []);

	const saveParticipants = useCallback(async (id: string, participants: ProjectParticipant[]) => {
		const updated = await projectService.saveParticipants(id, participants);
		if (updated) setItems(prev => prev.map(p => (p.id === id ? updated : p)));
		return updated;
	}, []);

	const getById = useCallback(async (id: string) => projectService.getById(id), []);

	return { me, loading, items, list, create, update, saveParticipants, getById };
}

