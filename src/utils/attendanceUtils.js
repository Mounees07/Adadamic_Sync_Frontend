// ─── Shared Attendance Calculation Utility ──────────────────────────────────
// Single source of truth — both StudentAttendance.jsx and DashboardOverview.jsx
// must import from here so percentages always match.

/** The official semester start date. Change ONLY here — both pages update. */
export const SEMESTER_START_DATE = new Date('2026-02-12');

/**
 * Count working days (Mon–Sat, excluding Sundays) between two dates inclusive.
 * @param {Date} from  start date
 * @param {Date} to    end date (defaults to today)
 * @returns {number}
 */
export const countWorkingDays = (from = SEMESTER_START_DATE, to = new Date()) => {
    let count = 0;
    const cur = new Date(from);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
        if (cur.getDay() !== 0) count++; // 0 = Sunday
        cur.setDate(cur.getDate() + 1);
    }
    return count;
};

/**
 * Calculate attendance percentage from a list of attendance records.
 * @param {Array}  attendanceRecords   Array returned by /attendance/student/:uid
 * @returns {{ percentage: number, presentDays: number, absentDays: number, totalWorkingDays: number }}
 */
export const calculateAttendance = (attendanceRecords = []) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalWorkingDays = countWorkingDays(SEMESTER_START_DATE, today);
    const presentDays = attendanceRecords.length;            // 1 record = 1 present day
    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    const percentage = totalWorkingDays > 0
        ? Math.round((presentDays / totalWorkingDays) * 100)
        : 0;

    return { percentage, presentDays, absentDays, totalWorkingDays };
};
