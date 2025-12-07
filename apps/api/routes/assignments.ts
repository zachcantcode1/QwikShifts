import { Hono } from 'hono';
import db from '../db';
import type { ShiftAssignment, User } from '@qwikshifts/core';
import { z } from 'zod';
import { validator } from 'hono/validator';
import { managerMiddleware } from '../middleware';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.use('*', managerMiddleware);

const assignSchema = z.object({
  shiftId: z.string(),
  employeeId: z.string(),
  roleId: z.string().optional(),
});

app.post('/assign', validator('json', (value, c) => {
  const parsed = assignSchema.safeParse(value);
  if (!parsed.success) {
    return c.json(parsed.error, 400);
  }
  return parsed.data;
}), async (c) => {
  const user = c.get('user');
  const { shiftId, employeeId, roleId } = c.req.valid('json');

  // Check if shift exists and belongs to user's org
  const shift = db.query("SELECT * FROM shifts WHERE id = ? AND org_id = ?").get(shiftId, user.orgId) as any;
  if (!shift) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  // Check for existing assignment
  const existing = db.query("SELECT * FROM assignments WHERE shift_id = ?").get(shiftId) as any;

  let assignment: ShiftAssignment;

  if (existing) {
    // Update existing assignment
    db.query("UPDATE assignments SET employee_id = ?, role_id = ? WHERE id = ?").run(
      employeeId, roleId || null, existing.id
    );
    assignment = {
      id: existing.id,
      shiftId,
      employeeId,
      roleId,
    };
  } else {
    // Create new assignment
    const newId = `assign-${Date.now()}`;
    db.query("INSERT INTO assignments (id, shift_id, employee_id, role_id) VALUES (?, ?, ?, ?)").run(
      newId, shiftId, employeeId, roleId || null
    );
    assignment = {
      id: newId,
      shiftId,
      employeeId,
      roleId,
    };
  }

  return c.json(assignment);
});

app.post('/unassign', validator('json', (value, c) => {
  const schema = z.object({ shiftId: z.string() });
  const parsed = schema.safeParse(value);
  if (!parsed.success) return c.json(parsed.error, 400);
  return parsed.data;
}), (c) => {
  const user = c.get('user');
  const { shiftId } = c.req.valid('json');

  // Verify shift belongs to user's org before deleting assignment
  const shift = db.query("SELECT * FROM shifts WHERE id = ? AND org_id = ?").get(shiftId, user.orgId) as any;
  if (!shift) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  db.query("DELETE FROM assignments WHERE shift_id = ?").run(shiftId);

  return c.json({ success: true });
});

export default app;
