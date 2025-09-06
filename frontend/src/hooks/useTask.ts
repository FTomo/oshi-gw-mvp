import { useCallback, useMemo, useState } from 'react';
import { taskService, type DbTask } from '../services/taskService';

export function useTask(projectId?: string) {
	const [items, setItems] = useState<DbTask[]>([]);
	const [loading, setLoading] = useState(false);

	const loadByProject = useCallback(async (pid: string) => {
		setLoading(true);
		try {
			const list = await taskService.listByProject(pid);
			setItems(list);
			return list;
		} finally {
			setLoading(false);
		}
	}, []);

	const createRoot = useCallback(async (managerUserId: string, payload: { title: string; description?: string; startDate?: string; endDate?: string; assigneeUserId?: string; progress?: number; }) => {
		if (!projectId) throw new Error('projectId required');
		const created = await taskService.createRootTask(projectId, managerUserId, payload);
		if (created) setItems(prev => [...prev, created]);
		return created;
	}, [projectId]);

	const createChild = useCallback(async (parentTaskId: string, payload: { title: string; description?: string; startDate?: string; endDate?: string; assigneeUserId?: string; progress?: number; }) => {
		const created = await taskService.createChildTask(parentTaskId, payload);
		if (created) setItems(prev => [...prev, created]);
		return created;
	}, []);

	const update = useCallback(async (id: string, patch: Partial<Pick<DbTask, 'title' | 'description' | 'startDate' | 'endDate' | 'assigneeUserId' | 'progress' | 'status'>>) => {
		const updated = await taskService.update(id, patch);
		if (updated) setItems(prev => prev.map(t => (t.id === id ? updated : t)));
		return updated;
	}, []);

	const remove = useCallback(async (id: string) => {
		const ok = await taskService.remove(id);
		if (ok) setItems(prev => prev.filter(t => t.id !== id));
		return ok;
	}, []);

	// 並び替え: 選択タスクを上下移動（ルート同士／同一ルート配下の子同士）
	const move = useCallback(async (targetId: string, dir: 'up' | 'down') => {
		const all = [...items];
		const target = all.find(t => t.id === targetId);
		if (!target) return null;
		const isRoot = !target.parentTaskId;
		if (isRoot) {
			// ルート同士のみ
			const roots = all.filter(t => !t.parentTaskId).sort((a, b) => a.sequence - b.sequence);
			const idx = roots.findIndex(t => t.id === targetId);
			if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === roots.length - 1)) return items;
		} else {
			// 同一ルート配下のみ
			const root = (() => {
				let p: DbTask | undefined = target;
				while (p && p.parentTaskId) p = all.find(t => t.id === p!.parentTaskId);
				return p;
			})();
			if (!root) return items;
			const siblingsUnderRoot = all.filter(t => t.numberPath.startsWith(root.numberPath + '.') && t.level === target.level && t.parentTaskId === target.parentTaskId)
				.sort((a, b) => a.sequence - b.sequence);
			const idx = siblingsUnderRoot.findIndex(t => t.id === targetId);
			if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === siblingsUnderRoot.length - 1)) return items;
		}

		const updated = await taskService.reorderWithinProject(all, targetId, dir);
		if (updated) setItems(updated);
		return updated;
	}, [items]);

	// gantt-task-react 用に整形（No順＝numberPath昇順、NameはNoを付加しない）
	const ganttTasks = useMemo(() => {
		const sorted = [...items].sort((a, b) => a.numberPath.localeCompare(b.numberPath));
		return sorted.map((t) => ({
			id: t.id,
			name: t.title,
			start: t.startDate ? new Date(t.startDate) : new Date(),
			end: t.endDate ? new Date(t.endDate) : new Date(),
			progress: t.progress ?? 0,
			type: 'task' as const,
			project: t.projectId,
			styles: { progressColor: '#1976d2', progressSelectedColor: '#1565c0' },
		}));
	}, [items]);

	return { items, loading, loadByProject, createRoot, createChild, update, remove, move, ganttTasks };
}

