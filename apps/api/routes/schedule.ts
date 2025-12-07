import { Hono } from 'hono';
import { DEMO_SHIFTS, DEMO_ASSIGNMENTS, DEMO_EMPLOYEES } from '../data';
import type { ShiftWithAssignment, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/week', (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const locationId = c.req.query('locationId');

  let shifts = DEMO_SHIFTS;

  if (locationId) {
    shifts = shifts.filter((s) => s.locationId === locationId);
  }

  if (from && to) {
    shifts = shifts.filter((s) => s.date >= from && s.date <= to);
  }

  const shiftsWithAssignments: ShiftWithAssignment[] = shifts.map((shift) => {
    const assignment = DEMO_ASSIGNMENTS.find((a) => a.shiftId === shift.id);
    return {
      ...shift,
      assignment: assignment || null,
    };
  });

  return c.json(shiftsWithAssignments);
});

app.get('/my', (c) => {
  const user = c.get('user');
  // Find all employee profiles for this user
  const employees = DEMO_EMPLOYEES.filter((e) => e.userId === user.id);

  if (employees.length === 0) {
    return c.json([]);
  }

  const employeeIds = employees.map(e => e.id);

  const from = c.req.query('from');
  const to = c.req.query('to');

  // Find assignments for these employees
  const myAssignments = DEMO_ASSIGNMENTS.filter((a) => employeeIds.includes(a.employeeId));
  const myShiftIds = myAssignments.map((a) => a.shiftId);

  let shifts = DEMO_SHIFTS.filter((s) => myShiftIds.includes(s.id));

  if (from && to) {
    shifts = shifts.filter((s) => s.date >= from && s.date <= to);
  }

  const shiftsWithAssignments: ShiftWithAssignment[] = shifts.map((shift) => {
    const assignment = DEMO_ASSIGNMENTS.find((a) => a.shiftId === shift.id);
    return {
      ...shift,
      assignment: assignment || null,
    };
  });

  return c.json(shiftsWithAssignments);
});

app.post('/shift', async (c) => {
  const body = await c.req.json();
  const { areaId, date, startTime, endTime, employeeId, roleId, orgId, locationId } = body;

  const newShiftId = `shift-${Date.now()}`;
  const newShift = {
    id: newShiftId,
    areaId,
    date,
    startTime,
    endTime,
    orgId: orgId || 'org-1', // Default to demo org
    locationId: locationId || 'loc-1', // Default to demo location
  };

  DEMO_SHIFTS.push(newShift);

  if (employeeId) {
    const newAssignment = {
      id: `assign-${Date.now()}`,
      shiftId: newShiftId,
      employeeId,
      roleId,
    };
    DEMO_ASSIGNMENTS.push(newAssignment);
  }

  return c.json(newShift);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { startTime, endTime } = body;

  const shiftIndex = DEMO_SHIFTS.findIndex((s) => s.id === id);
  if (shiftIndex === -1) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  DEMO_SHIFTS[shiftIndex] = {
    ...DEMO_SHIFTS[shiftIndex],
    startTime,
    endTime,
  };

  return c.json(DEMO_SHIFTS[shiftIndex]);
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const shiftIndex = DEMO_SHIFTS.findIndex((s) => s.id === id);

  if (shiftIndex === -1) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  // Remove the shift
  DEMO_SHIFTS.splice(shiftIndex, 1);

  // Remove associated assignments
  // In a real DB this would be a cascade delete or separate query
  // Here we just filter them out or splice if we want to be precise
  // Since DEMO_ASSIGNMENTS is an array, let's just remove all matching
  let i = DEMO_ASSIGNMENTS.length;
  while (i--) {
    if (DEMO_ASSIGNMENTS[i].shiftId === id) {
      DEMO_ASSIGNMENTS.splice(i, 1);
    }
  }

  return c.json({ success: true });
});

export default app;
