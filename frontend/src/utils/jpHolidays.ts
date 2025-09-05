// 日本の祝日（簡易・固定表）: 必要年のみ静的定義。将来API置換予定。
// 参考: 2025 年（閏年でない）主要祝日 + 振替休日

const HOLIDAYS_2025 = [
  '2025-01-01', // 元日
  '2025-01-13', // 成人の日 (2nd Mon Jan)
  '2025-02-11', // 建国記念の日
  '2025-02-23', // 天皇誕生日
  '2025-02-24', // 振替 (23 Sun)
  '2025-03-20', // 春分の日 (暫定)
  '2025-04-29', // 昭和の日
  '2025-05-03', // 憲法記念日
  '2025-05-04', // みどりの日
  '2025-05-05', // こどもの日
  '2025-05-06', // 振替 (4 Sun)
  '2025-07-21', // 海の日 (3rd Mon Jul)
  '2025-08-11', // 山の日
  '2025-09-15', // 敬老の日 (3rd Mon Sep)
  '2025-09-23', // 秋分の日 (暫定)
  '2025-10-13', // スポーツの日 (2nd Mon Oct)
  '2025-11-03', // 文化の日
  '2025-11-23', // 勤労感謝の日
  '2025-11-24', // 振替 (23 Sun)
];

export function getJpHolidays(year: number): string[] {
  switch (year) {
    case 2025:
      return HOLIDAYS_2025;
    default:
      return []; // 他年は未定義（将来拡張）
  }
}

// JST weekend 判定 (土日)
export function isJstWeekend(date: Date): boolean {
  const jst = new Date(date.getTime() + 9 * 3600 * 1000);
  const day = jst.getUTCDay(); // 0:Sun 6:Sat
  return day === 0 || day === 6;
}
