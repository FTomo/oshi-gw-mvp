import { generateClient } from 'aws-amplify/api';
import { createTask, updateTask, deleteTask } from '../mutations';
import { getTask, listTasks } from '../queries';
import type * as APITypes from '../API';

export type DbTask = {
	id: string;
	projectId: string;
	parentTaskId?: string | null;
	projectManagerUserId?: string | null;
	assigneeUserId?: string | null;
	level: number;        // 1,2,3
	sequence: number;     // siblings order
	numberPath: string;   // 0-padded e.g. 001.002
	title: string;
	description?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	progress?: number | null;
	status?: string | null;
	createdAt?: string;
	updatedAt?: string;
};

const client = generateClient();

const pad = (n: number) => n.toString().padStart(3, '0');
export const displayTaskNumber = (numberPath: string) => numberPath.split('.').map(s => parseInt(s, 10)).join('.');

function toNullEmpty<T extends Record<string, any>>(obj: T): T {
	const out: any = { ...obj };
	['description', 'startDate', 'endDate', 'assigneeUserId', 'status'].forEach(k => {
		if (out[k] === '') out[k] = null;
	});
	return out;
}

function mapApiTask(t: any): DbTask {
	return {
		id: t.id,
		projectId: t.projectId,
		parentTaskId: t.parentTaskId ?? null,
		projectManagerUserId: t.projectManagerUserId ?? null,
		assigneeUserId: t.assigneeUserId ?? null,
		level: typeof t.level === 'number' ? t.level : parseInt(String(t.level ?? '1'), 10),
		sequence: typeof t.sequence === 'number' ? t.sequence : parseInt(String(t.sequence ?? '1'), 10),
		numberPath: t.numberPath ?? '001',
		title: t.title,
		description: t.description ?? null,
		startDate: t.startDate ?? null,
		endDate: t.endDate ?? null,
		progress: t.progress ?? 0,
		status: t.status ?? 'open',
		createdAt: t.createdAt,
		updatedAt: t.updatedAt,
	};
}

export const taskService = {
	async getById(id: string): Promise<DbTask | null> {
		try {
			const res = await client.graphql({ query: getTask, variables: { id } }) as unknown as { data?: { getTask?: APITypes.GetTaskQuery['getTask'] } };
			const t = res.data?.getTask;
			return t ? mapApiTask(t) : null;
		} catch (e) {
			console.error('task.getById error', e);
			return null;
		}
	},

	async listByProject(projectId: string, pageSize = 200): Promise<DbTask[]> {
		try {
			let nextToken: string | null | undefined = undefined;
			const all: any[] = [];
			do {
				const res = await client.graphql({
					query: listTasks,
					variables: { filter: { projectId: { eq: projectId } }, limit: pageSize, nextToken },
				}) as unknown as { data?: APITypes.ListTasksQuery };
				const page = res.data?.listTasks?.items ?? [];
				all.push(...page.filter(Boolean));
				nextToken = res.data?.listTasks?.nextToken ?? null;
			} while (nextToken);
			return all.map(mapApiTask);
		} catch (e) {
			console.error('task.listByProject error', e);
			return [];
		}
	},

	async listByParent(parentTaskId: string, all: DbTask[]) {
		return all.filter(t => t.parentTaskId === parentTaskId).sort((a, b) => a.sequence - b.sequence);
	},

	async createRaw(input: Omit<DbTask, 'id' | 'createdAt' | 'updatedAt' | 'numberPath' | 'sequence' | 'level'> & Partial<Pick<DbTask, 'numberPath' | 'sequence' | 'level'>>): Promise<DbTask | null> {
		try {
			const res = await client.graphql({ query: createTask, variables: { input: toNullEmpty(input) }, authMode: 'userPool' }) as unknown as { data?: APITypes.CreateTaskMutation };
			const t = res.data?.createTask;
			return t ? mapApiTask(t) : null;
		} catch (e) {
			console.error('task.createRaw error', e);
			return null;
		}
	},

	async createRootTask(projectId: string, managerUserId: string, payload: Partial<DbTask> & { title: string }) {
		const all = await this.listByProject(projectId);
		const roots = all.filter(t => !t.parentTaskId);
		const sequence = roots.length + 1;
		const numberPath = pad(sequence);
		return await this.createRaw({
			projectId,
			parentTaskId: null,
			projectManagerUserId: managerUserId,
			level: 1,
			sequence,
			numberPath,
			title: payload.title,
			description: payload.description ?? null,
			startDate: payload.startDate ?? null,
			endDate: payload.endDate ?? null,
			assigneeUserId: payload.assigneeUserId ?? null,
			progress: payload.progress ?? 0,
			status: payload.status ?? 'open',
		});
	},

	async createChildTask(parentTaskId: string, payload: Partial<DbTask> & { title: string }) {
		const parent = await this.getById(parentTaskId);
		if (!parent) throw new Error('parent not found');
		if (parent.level >= 3) throw new Error('max level reached');
		const all = await this.listByProject(parent.projectId);
		const siblings = all.filter(t => t.parentTaskId === parentTaskId);
		const sequence = siblings.length + 1;
		const numberPath = `${parent.numberPath}.${pad(sequence)}`;
		return await this.createRaw({
			projectId: parent.projectId,
			parentTaskId,
			projectManagerUserId: parent.projectManagerUserId ?? null,
			level: (parent.level as number) + 1,
			sequence,
			numberPath,
			title: payload.title,
			description: payload.description ?? null,
			startDate: payload.startDate ?? null,
			endDate: payload.endDate ?? null,
			assigneeUserId: payload.assigneeUserId ?? null,
			progress: payload.progress ?? 0,
			status: payload.status ?? 'open',
		});
	},

	async update(id: string, patch: Partial<Omit<DbTask, 'id' | 'projectId' | 'numberPath' | 'sequence' | 'level'>>) {
		try {
			const res = await client.graphql({ query: updateTask, variables: { input: { id, ...toNullEmpty(patch) } }, authMode: 'userPool' }) as unknown as { data?: APITypes.UpdateTaskMutation };
			const t = res.data?.updateTask;
			return t ? mapApiTask(t) : null;
		} catch (e) {
			console.error('task.update error', e);
			return null;
		}
	},

	async remove(id: string) {
		try {
			await client.graphql({ query: deleteTask, variables: { input: { id } }, authMode: 'userPool' });
			return true;
		} catch (e) {
			console.error('task.remove error', e);
			return false;
		}
	},

	// 順序用: sequence/numberPath を更新するための低レベルAPI
	async updateOrderFields(id: string, fields: Partial<Pick<DbTask, 'sequence' | 'numberPath'>>) {
		try {
			const res = await client.graphql({ query: updateTask, variables: { input: { id, ...fields } }, authMode: 'userPool' }) as unknown as { data?: APITypes.UpdateTaskMutation };
			const t = res.data?.updateTask;
			return t ? mapApiTask(t) : null;
		} catch (e) {
			console.error('task.updateOrderFields error', e);
			return null;
		}
	},

	// 同一親（親なし=ルート同士）内で上下入れ替え。必要なレコードの sequence/numberPath を順次更新。
		async reorderWithinProject(all: DbTask[], targetId: string, dir: 'up' | 'down'): Promise<DbTask[] | null> {
			const target = all.find(t => t.id === targetId);
		if (!target) return null;
		const isRoot = !target.parentTaskId;
		const siblings = all.filter(t => (isRoot ? !t.parentTaskId : t.parentTaskId === target.parentTaskId)).sort((a, b) => a.sequence - b.sequence);
		const idx = siblings.findIndex(t => t.id === targetId);
		if (idx < 0) return null;
		if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === siblings.length - 1)) return all; // 端

		// スワップ後に連番振り直し
		const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
		const newOrder = [...siblings];
		[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
		const parentNumberPath = isRoot ? '' : (all.find(t => t.id === target.parentTaskId)?.numberPath ?? '');

		// 旧→新のプレフィックス表
		const prefixMap: Array<{ oldPrefix: string; newPrefix: string; id: string; newSeq: number }> = [];
		newOrder.forEach((s, i) => {
			const newSeq = i + 1;
			const newPrefix = (isRoot ? '' : parentNumberPath + '.') + pad(newSeq);
			prefixMap.push({ oldPrefix: s.numberPath, newPrefix, id: s.id, newSeq });
		});

		// ローカル配列を更新
		const updatedAll = all.map(t => {
			// 該当兄弟なら sequence と numberPath を更新
			const map = prefixMap.find(m => m.id === t.id);
			if (map) {
				return { ...t, sequence: map.newSeq, numberPath: map.newPrefix };
			}
			// 子孫なら prefix 置換
			const hit = prefixMap.find(m => t.numberPath.startsWith(m.oldPrefix + '.'));
			if (hit) {
				const rest = t.numberPath.slice(hit.oldPrefix.length);
				return { ...t, numberPath: hit.newPrefix + rest };
			}
			return t;
		});

		// 永続化（兄弟＋子孫の numberPath、兄弟の sequence）
		for (const before of all) {
			const after = updatedAll.find(t => t.id === before.id)!;
			if (!after) continue;
			const needOrderUpdate = before.numberPath !== after.numberPath || before.sequence !== after.sequence;
			if (needOrderUpdate) {
				await this.updateOrderFields(after.id, { sequence: after.sequence, numberPath: after.numberPath });
			}
		}

		return updatedAll;
	},
};

