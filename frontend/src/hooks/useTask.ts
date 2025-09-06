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

	return { items, loading, loadByProject, createRoot, createChild, update, remove, ganttTasks };
}

