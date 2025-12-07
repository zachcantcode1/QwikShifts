import { Hono } from 'hono';
import db from '../db';
import type { User } from '@qwikshifts/core';
import { 
  DEMO_EMPLOYEES, 
  DEMO_ASSIGNMENTS, 
  DEMO_SHIFTS,
  DEMO_USERS
} from '../data';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInHours } from 'date-fns';

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
  const pendingTimeOffCount = pendingRequests.count;

  // 2. Overtime Risk
  // Calculate hours for current week for each employee
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const overtimeRisks = DEMO_EMPLOYEES.map(employee => {
    const employeeAssignments = DEMO_ASSIGNMENTS.filter(a => a.employeeId === employee.id);
    
    let totalHours = 0;
    
    employeeAssignments.forEach(assignment => {
      const shift = DEMO_SHIFTS.find(s => s.id === assignment.shiftId);
      if (shift) {
        const shiftDate = parseISO(shift.date);
        if (isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })) {
          // Simple duration calculation assuming start/end times are parseable
          // In a real app, we'd parse the time strings properly
          const start = parseISO(`${shift.date}T${shift.startTime}`);
          const end = parseISO(`${shift.date}T${shift.endTime}`);
          const hours = differenceInHours(end, start);
          totalHours += hours;
        }
      }
    });

    const limit = employee.weeklyHoursLimit || 40;
    const threshold = limit * 0.9; // 90% of limit

    if (totalHours >= threshold) {
      const user = DEMO_USERS.find(u => u.id === employee.userId);
      return {
        employeeId: employee.id,
        name: user?.name || 'Unknown',
        currentHours: totalHours,
        limit: limit
      };
    }
    return null;
  }).filter(Boolean);

  // 3. Upcoming Shifts (Next 48 hours)
  // For demo purposes, we'll just look at "today" and "tomorrow" based on string comparison or simple date logic
  // Since demo data might be static, let's just count total shifts in the system for now or use a fixed date range if needed.
  // Actually, let's just return a summary of "Today's" shifts.
  
  const todayStr = now.toISOString().split('T')[0];
  const todaysShifts = DEMO_SHIFTS.filter(s => s.date === todayStr);
  const totalShiftsToday = todaysShifts.length;
  
  const unassignedShiftsToday = todaysShifts.filter(shift => {
    return !DEMO_ASSIGNMENTS.some(a => a.shiftId === shift.id);
  }).length;

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
