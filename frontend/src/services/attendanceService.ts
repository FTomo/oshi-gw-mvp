import { generateClient } from 'aws-amplify/api';
import { createAttendance, updateAttendance, deleteAttendance } from '../mutations';
import { getAttendance, listAttendances } from '../queries';

export type DbAttendance = {
	id: string;
	userId: string;
	date: string; // AWSDate (YYYY-MM-DD)
	clockIn?: string | null; // AWSTime
	clockOut?: string | null; // AWSTime
	plannedOff?: boolean | null;
	note?: string | null;
};

const client = generateClient();

export const attendanceService = {
	async get(id: string) {
		try {
			const res = await client.graphql({ query: getAttendance, variables: { id } }) as { data?: { getAttendance?: DbAttendance } };
			return res.data?.getAttendance ?? null;
		} catch (e) {
			console.error('attendance.get error', e);
			return null;
		}
	},
	async listByUserAndRange(userId: string, from: string, to: string) {
		// フィルタはクライアント側簡易実装（件数増大時はGSI検討）
		try {
			const res = await client.graphql({ query: listAttendances, variables: { limit: 500 } }) as { data?: { listAttendances?: { items: DbAttendance[] } } };
			return (res.data?.listAttendances?.items ?? []).filter(r => r.userId === userId && r.date >= from && r.date <= to);
		} catch (e) {
			console.error('attendance.listByUserAndRange error', e);
			return [];
		}
	},
	async create(input: Omit<DbAttendance, 'id'> & { id?: string }) {
		try {
			const res = await client.graphql({ query: createAttendance, variables: { input }, authMode: 'userPool' }) as { data?: { createAttendance: DbAttendance } };
			return res.data?.createAttendance ?? null;
		} catch (e) {
			console.error('attendance.create error', e);
			return null;
		}
	},
	async update(id: string, patch: Partial<Omit<DbAttendance, 'id' | 'userId' | 'date'>>) {
		try {
			const res = await client.graphql({ query: updateAttendance, variables: { input: { id, ...patch } }, authMode: 'userPool' }) as { data?: { updateAttendance: DbAttendance } };
			return res.data?.updateAttendance ?? null;
		} catch (e) {
			console.error('attendance.update error', e);
			return null;
		}
	},
	async remove(id: string) {
		try {
			await client.graphql({ query: deleteAttendance, variables: { input: { id } }, authMode: 'userPool' });
			return true;
		} catch (e) {
			console.error('attendance.remove error', e);
			return false;
		}
	},
	async punchInOrOut(params: { userId: string; date: string; action: 'in' | 'out'; time: string; note?: string }) {
		// 既存当日レコードを検索（簡易: list→filter）
		const existingList = await this.listByUserAndRange(params.userId, params.date, params.date);
		let rec = existingList[0];
		if (!rec) {
			rec = await this.create({ userId: params.userId, date: params.date, clockIn: params.action === 'in' ? params.time : null, clockOut: params.action === 'out' ? params.time : null, plannedOff: false, note: params.note ?? null }) as DbAttendance;
			return rec;
		}
		if (params.action === 'in') {
			if (!rec.clockIn) return await this.update(rec.id, { clockIn: params.time, note: params.note });
		} else {
			if (!rec.clockOut) return await this.update(rec.id, { clockOut: params.time, note: params.note });
		}
		return rec; // 既に打刻済み
	},
};

