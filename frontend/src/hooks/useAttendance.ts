import { useCallback, useState } from 'react';
import { attendanceService, type DbAttendance } from '../services/attendanceService';
import { useUser } from './useUser';

// JST (UTC+9) 基準ユーティリティ
const jstNow = () => {
	const now = new Date();
	return new Date(now.getTime() + 9 * 60 * 60 * 1000); // +9h
};
const todayDate = () => jstNow().toISOString().slice(0, 10);
const nowTime = () => jstNow().toISOString().slice(11, 19);

export function useAttendance() {
	const { me } = useUser();
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState<DbAttendance[]>([]);

	const loadRange = useCallback(async (from: string, to: string) => {
		if (!me) return [];
		setLoading(true);
		try {
			const list = await attendanceService.listByUserAndRange(me.sub, from, to);
			setItems(list);
			return list;
		} finally {
			setLoading(false);
		}
	}, [me]);

	const upsertLocal = (rec: DbAttendance) => {
		setItems(prev => {
			const idx = prev.findIndex(p => p.id === rec.id);
			if (idx === -1) return [...prev, rec];
			const copy = [...prev];
			copy[idx] = rec;
			return copy;
		});
	};

	const punchIn = useCallback(async () => {
		if (!me) return null;
		const rec = await attendanceService.punchInOrOut({ userId: me.sub, date: todayDate(), action: 'in', time: nowTime() });
		if (rec) upsertLocal(rec as DbAttendance);
		return rec;
	}, [me]);

	const punchOut = useCallback(async () => {
		if (!me) return null;
		const rec = await attendanceService.punchInOrOut({ userId: me.sub, date: todayDate(), action: 'out', time: nowTime() });
		if (rec) upsertLocal(rec as DbAttendance);
		return rec;
	}, [me]);

	const updateNote = useCallback(async (id: string, note: string) => {
		const updated = await attendanceService.update(id, { note });
		if (updated) upsertLocal(updated);
		return updated;
	}, []);

	const markPlannedOff = useCallback(async (date: string, plannedOff: boolean) => {
		if (!me) return null;
		let rec = items.find(r => r.date === date);
		if (!rec) {
			rec = await attendanceService.create({ userId: me.sub, date, plannedOff, clockIn: null, clockOut: null, note: null }) as DbAttendance;
			if (rec) upsertLocal(rec);
			return rec;
		}
		const updated = await attendanceService.update(rec.id, { plannedOff });
		if (updated) upsertLocal(updated);
		return updated;
	}, [items, me]);

	const manualEdit = useCallback(async (id: string, patch: Partial<Pick<DbAttendance, 'clockIn' | 'clockOut' | 'note' | 'plannedOff'>>) => {
		const updated = await attendanceService.update(id, patch);
		if (updated) upsertLocal(updated);
		return updated;
	}, []);

	return { loading, items, loadRange, punchIn, punchOut, updateNote, markPlannedOff, manualEdit };
}


