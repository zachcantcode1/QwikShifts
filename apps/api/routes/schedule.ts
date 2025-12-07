import { Hono } from 'hono';
import db from '../db';
import type { ShiftWithAssignment, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/week', (c) => {
  const user = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const locationId = c.req.query('locationId');

  let query = "SELECT * FROM shifts WHERE org_id = ?";
  const params: any[] = [user.orgId];

  if (locationId) {
    query += " AND location_id = ?";
    params.push(locationId);
  }

  if (from && to) {
    query += " AND date >= ? AND date <= ?";
    params.push(from, to);
  }

  const shifts = db.query(query).all(...params) as any[];

  const shiftsWithAssignments: ShiftWithAssignment[] = shifts.map((shift) => {
    const assignment = db.query("SELECT * FROM assignments WHERE shift_id = ?").get(shift.id) as any;

    return {
      id: shift.id,
      areaId: shift.area_id,
      date: shift.date,
      startTime: shift.start_time,
      endTime: shift.end_time,
      orgId: shift.org_id,
      locationId: shift.location_id,
      assignment: assignment ? {
        id: assignment.id,
        shiftId: assignment.shift_id,
        employeeId: assignment.employee_id,
        roleId: assignment.role_id,
      } : null,
    };
  });

  return c.json(shiftsWithAssignments);
});

app.get('/my', (c) => {
  const user = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');

  // Find all employee profiles for this user
  const employees = db.query("SELECT * FROM employees WHERE user_id = ?").all(user.id) as any[];

  if (employees.length === 0) {
    return c.json([]);
  }

  const employeeIds = employees.map(e => e.id);
  const placeholders = employeeIds.map(() => '?').join(',');

  // Find shifts assigned to these employees
  let query = `
    SELECT s.*, a.id as assignment_id, a.employee_id, a.role_id 
    FROM shifts s
    JOIN assignments a ON s.id = a.shift_id
    WHERE a.employee_id IN (${placeholders})
  `;
  const params: any[] = [...employeeIds];

  if (from && to) {
    query += " AND s.date >= ? AND s.date <= ?";
    params.push(from, to);
  }

  const results = db.query(query).all(...params) as any[];

  const shiftsWithAssignments: ShiftWithAssignment[] = results.map((row) => ({
    id: row.id,
    areaId: row.area_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    orgId: row.org_id,
    locationId: row.location_id,
    assignment: {
      id: row.assignment_id,
      shiftId: row.id,
      employeeId: row.employee_id,
      roleId: row.role_id,
    },
  }));

  return c.json(shiftsWithAssignments);
});

app.post('/shift', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { areaId, date, startTime, endTime, employeeId, roleId, locationId } = body;

  const newShiftId = `shift-${Date.now()}`;
  const orgId = user.orgId;
  const locId = locationId || null;

  if (!locId) {
    return c.json({ error: 'Location ID is required' }, 400);
  }

  db.query(`
    INSERT INTO shifts (id, area_id, date, start_time, end_time, org_id, location_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(newShiftId, areaId, date, startTime, endTime, orgId, locId);

  if (employeeId) {
    const newAssignmentId = `assign-${Date.now()}`;
    db.query(`
      INSERT INTO assignments (id, shift_id, employee_id, role_id)
      VALUES (?, ?, ?, ?)
    `).run(newAssignmentId, newShiftId, employeeId, roleId || null);
  }

  return c.json({
    id: newShiftId,
    areaId,
    date,
    startTime,
    endTime,
    orgId,
    locationId: locId,
  });
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { startTime, endTime } = body;

  const result = db.query(`
    UPDATE shifts SET start_time = ?, end_time = ? 
    WHERE id = ? AND org_id = ?
  `).run(startTime, endTime, id, user.orgId);

  if (result.changes === 0) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  const updated = db.query("SELECT * FROM shifts WHERE id = ?").get(id) as any;

  return c.json({
    id: updated.id,
    areaId: updated.area_id,
    date: updated.date,
    startTime: updated.start_time,
    endTime: updated.end_time,
    orgId: updated.org_id,
    locationId: updated.location_id,
  });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = db.query("DELETE FROM shifts WHERE id = ? AND org_id = ?").run(id, user.orgId);

  if (result.changes === 0) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  // Assignments will be cascade deleted due to FK constraint

  return c.json({ success: true });
});

export default app;
