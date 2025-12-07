import { Hono } from 'hono';
import db from '../db';
import type { User } from '@qwikshifts/core';
import { startOfWeek, endOfWeek, parseISO, differenceInHours, format } from 'date-fns';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/stats', (c) => {
  const user = c.get('user');

  // 1. Pending Time Off Requests
  const pendingRequests = db.query("SELECT COUNT(*) as count FROM time_off_requests WHERE status = 'pending' AND org_id = ?").get(user.orgId) as any;
  const pendingTimeOffCount = pendingRequests?.count || 0;

  // 2. Overtime Risk
  // Calculate hours for current week for each employee
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Get all employees with their hour limits
  const employees = db.query(`
    SELECT e.*, u.name as user_name, r.value as rule_value
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN rules r ON e.rule_id = r.id
    WHERE e.org_id = ?
  `).all(user.orgId) as any[];

  const overtimeRisks = employees.map(employee => {
    // Get all shifts assigned to this employee in the current week
    const assignments = db.query(`
      SELECT s.* FROM shifts s
      JOIN assignments a ON s.id = a.shift_id
      WHERE a.employee_id = ? AND s.date >= ? AND s.date <= ?
    `).all(employee.id, weekStartStr, weekEndStr) as any[];

    let totalHours = 0;

    assignments.forEach((shift: any) => {
      try {
        const start = parseISO(`${shift.date}T${shift.start_time}`);
        const end = parseISO(`${shift.date}T${shift.end_time}`);
        const hours = differenceInHours(end, start);
        totalHours += hours;
      } catch (e) {
        // Skip if date parsing fails
      }
    });

    const limit = employee.weekly_hours_limit || employee.rule_value || 40;
    const threshold = limit * 0.9; // 90% of limit

    if (totalHours >= threshold) {
      return {
        employeeId: employee.id,
        name: employee.user_name || 'Unknown',
        currentHours: totalHours,
        limit: limit
      };
    }
    return null;
  }).filter(Boolean);

  // 3. Today's Shifts Stats
  const todayStr = format(now, 'yyyy-MM-dd');

  const todaysShifts = db.query("SELECT * FROM shifts WHERE org_id = ? AND date = ?").all(user.orgId, todayStr) as any[];
  const totalShiftsToday = todaysShifts.length;

  // Count unassigned shifts
  let unassignedShiftsToday = 0;
  for (const shift of todaysShifts) {
    const assignment = db.query("SELECT * FROM assignments WHERE shift_id = ?").get(shift.id);
    if (!assignment) {
      unassignedShiftsToday++;
    }
  }

  return c.json({
    pendingTimeOffCount,
    overtimeRisks,
    todaysStats: {
      totalShifts: totalShiftsToday,
      unassignedShifts: unassignedShiftsToday
    }
  });
});

export default app;
