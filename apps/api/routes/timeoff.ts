import { Hono } from 'hono';
import db from '../db';
import type { TimeOffRequest, User, TimeOffRequestWithEmployee } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

// Get all requests (Manager view)
app.get('/', (c) => {
  const user = c.get('user');
  
  const requests = db.query(`
    SELECT t.*, e.user_id, u.name as user_name, u.email as user_email, e.location_id, e.weekly_hours_limit, e.rule_id
    FROM time_off_requests t
    JOIN employees e ON t.employee_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE t.org_id = ?
  `).all(user.orgId) as any[];

  const requestsWithEmployee: TimeOffRequestWithEmployee[] = requests.map(r => ({
    id: r.id,
    employeeId: r.employee_id,
    date: r.date,
    isFullDay: Boolean(r.is_full_day),
    startTime: r.start_time,
    endTime: r.end_time,
    reason: r.reason,
    status: r.status as 'pending' | 'approved' | 'rejected',
    orgId: r.org_id,
    employee: {
      id: r.employee_id,
      userId: r.user_id,
      orgId: r.org_id,
      locationId: r.location_id,
      weeklyHoursLimit: r.weekly_hours_limit,
      ruleId: r.rule_id,
      user: {
        name: r.user_name,
        email: r.user_email
      }
    }
  }));

  return c.json(requestsWithEmployee);
});

// Get my requests (Employee view)
app.get('/my', (c) => {
  const user = c.get('user');
  const employee = db.query("SELECT * FROM employees WHERE user_id = ?").get(user.id) as any;
  
  if (!employee) return c.json([]);

  const requests = db.query("SELECT * FROM time_off_requests WHERE employee_id = ?").all(employee.id) as any[];
  
  return c.json(requests.map(r => ({
    id: r.id,
    employeeId: r.employee_id,
    date: r.date,
    isFullDay: Boolean(r.is_full_day),
    startTime: r.start_time,
    endTime: r.end_time,
    reason: r.reason,
    status: r.status,
    orgId: r.org_id
  })));
});

// Create request
app.post('/', async (c) => {
  const user = c.get('user');
  const employee = db.query("SELECT * FROM employees WHERE user_id = ?").get(user.id) as any;
  
  if (!employee) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  const body = await c.req.json();
  const { date, isFullDay, startTime, endTime, reason } = body;

  const id = `req-${Date.now()}`;
  
  db.run(`
    INSERT INTO time_off_requests (id, employee_id, date, is_full_day, start_time, end_time, reason, status, org_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, employee.id, date, isFullDay ? 1 : 0, startTime, endTime, reason, 'pending', employee.org_id]);

  const newRequest: TimeOffRequest = {
    id,
    employeeId: employee.id,
    date,
    isFullDay,
    startTime,
    endTime,
    reason,
    status: 'pending',
    orgId: employee.org_id,
  };

  return c.json(newRequest);
});

// Update status (Manager action)
app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  const result = db.run("UPDATE time_off_requests SET status = ? WHERE id = ?", [status, id]);
  
  if (result.changes === 0) {
    return c.json({ error: 'Request not found' }, 404);
  }

  const updated = db.query("SELECT * FROM time_off_requests WHERE id = ?").get(id) as any;

  return c.json({
    id: updated.id,
    employeeId: updated.employee_id,
    date: updated.date,
    isFullDay: Boolean(updated.is_full_day),
    startTime: updated.start_time,
    endTime: updated.end_time,
    reason: updated.reason,
    status: updated.status,
    orgId: updated.org_id
  });
});

export default app;
