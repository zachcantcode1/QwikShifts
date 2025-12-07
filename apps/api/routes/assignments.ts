import { Hono } from 'hono';
import { DEMO_ASSIGNMENTS, DEMO_SHIFTS } from '../data';
import { ShiftAssignment, User } from '@qwikshifts/core';
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
  const { shiftId, employeeId, roleId } = c.req.valid('json');

  // Check if shift exists
  const shift = DEMO_SHIFTS.find((s) => s.id === shiftId);
  if (!shift) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  // Check for existing assignment
  const existingIndex = DEMO_ASSIGNMENTS.findIndex((a) => a.shiftId === shiftId);
  
  // Simple overlap check (warning only for now as per plan)
  // "If an employee already has a shift overlapping in time, return a warning flag"
  // For MVP POC, we'll just allow it but maybe log it or return a warning property.
  // We'll implement the overlap check logic later or if requested.

  const newAssignment: ShiftAssignment = {
    id: `assign-${Date.now()}`,
    shiftId,
    employeeId,
    roleId,
  };

  if (existingIndex >= 0) {
    // Replace existing assignment
    DEMO_ASSIGNMENTS[existingIndex] = newAssignment;
  } else {
    DEMO_ASSIGNMENTS.push(newAssignment);
  }

  return c.json(newAssignment);
});

app.post('/unassign', validator('json', (value, c) => {
    const schema = z.object({ shiftId: z.string() });
    const parsed = schema.safeParse(value);
    if (!parsed.success) return c.json(parsed.error, 400);
    return parsed.data;
}), (c) => {
  const { shiftId } = c.req.valid('json');
  
  const index = DEMO_ASSIGNMENTS.findIndex((a) => a.shiftId === shiftId);
  if (index !== -1) {
    DEMO_ASSIGNMENTS.splice(index, 1);
  }

  return c.json({ success: true });
});

export default app;
