import { generateClient } from 'aws-amplify/api';
import { createProject, updateProject, deleteProject } from '../mutations';
import { getProject, listProjects } from '../queries';

export type ProjectParticipant = {
	// タスクの assignee として参照する恒久ID（必須・システム内ユーザーと独立）
	assigneeUserId: string;
	// システム内 User テーブルの id（Cognito sub）。社内ユーザーに対応するときのみ設定
	userId?: string | null;
	name: string;           // 本名など
	displayName: string;    // タスク内表示名
	canEdit?: boolean;      // 編集権限（UI用）
	canView?: boolean;      // 閲覧権限（UI用）
};

export type DbProject = {
	id: string;
	name: string;
	managerUserId: string;
	startDate?: string | null;
	endDate?: string | null;
	description?: string | null;
	participantsJson?: string | null;       // JSON.stringify(ProjectParticipant[])
	editableUserIdsJson?: string | null;    // JSON.stringify(string[])
	readableUserIdsJson?: string | null;    // JSON.stringify(string[])
	createdAt?: string;
	updatedAt?: string;
};

const client = generateClient();

// 軽量な一意ID生成（ブラウザ/Node 共通）
export function generateAssigneeId() {
	return 'asg_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

function normalizeProjectInput(input: Partial<DbProject>) {
	// 空文字は null へ
	const toNull = (v: any) => (v === '' ? null : v);
	const out: any = { ...input };
	out.startDate = toNull(out.startDate);
	out.endDate = toNull(out.endDate);
	out.description = toNull(out.description);
	out.participantsJson = out.participantsJson ?? null;
	out.editableUserIdsJson = out.editableUserIdsJson ?? null;
	out.readableUserIdsJson = out.readableUserIdsJson ?? null;
	return out;
}

export const projectService = {
	async getById(id: string): Promise<DbProject | null> {
		try {
			const res = await client.graphql({ query: getProject, variables: { id } }) as { data?: { getProject?: DbProject } };
			return res.data?.getProject ?? null;
		} catch (e) {
			console.error('project.getById error', e);
			return null;
		}
	},

	async list(limit = 100, nextToken?: string): Promise<{ items: DbProject[]; nextToken: string | null }> {
		try {
			const res = await client.graphql({ query: listProjects, variables: { limit, nextToken } }) as { data?: { listProjects?: { items: DbProject[]; nextToken?: string | null } } };
			return { items: res.data?.listProjects?.items ?? [], nextToken: res.data?.listProjects?.nextToken ?? null };
		} catch (e) {
			console.error('project.list error', e);
			return { items: [], nextToken: null };
		}
	},

	async create(input: Omit<DbProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DbProject | null> {
		try {
			const res = await client.graphql({ query: createProject, variables: { input: normalizeProjectInput(input) }, authMode: 'userPool' }) as { data?: { createProject: DbProject } };
			return res.data?.createProject ?? null;
		} catch (e) {
			console.error('project.create error', e);
			return null;
		}
	},

	async update(id: string, patch: Partial<Omit<DbProject, 'id' | 'managerUserId'>>): Promise<DbProject | null> {
		try {
			const res = await client.graphql({ query: updateProject, variables: { input: { id, ...normalizeProjectInput(patch) } }, authMode: 'userPool' }) as { data?: { updateProject: DbProject } };
			return res.data?.updateProject ?? null;
		} catch (e) {
			console.error('project.update error', e);
			return null;
		}
	},

	async remove(id: string): Promise<boolean> {
		try {
			await client.graphql({ query: deleteProject, variables: { input: { id } }, authMode: 'userPool' });
			return true;
		} catch (e) {
			console.error('project.remove error', e);
			return false;
		}
	},

	// participantsJson を編集し、編集/閲覧権限の userId 配列も同期更新
	async saveParticipants(projectId: string, participants: ProjectParticipant[]): Promise<DbProject | null> {
		// assigneeUserId を必須化（不足している場合は付与）
		const withIds = participants.map(p => ({
			...p,
			assigneeUserId: p.assigneeUserId && p.assigneeUserId.length > 0 ? p.assigneeUserId : generateAssigneeId(),
		}));
		const editableIds = withIds.filter(p => p.canEdit && p.userId).map(p => p.userId!)
		const readableIds = withIds.filter(p => p.canView && p.userId).map(p => p.userId!)
		return await this.update(projectId, {
			participantsJson: JSON.stringify(withIds),
			editableUserIdsJson: JSON.stringify(editableIds),
			readableUserIdsJson: JSON.stringify(readableIds),
		});
	},
};

