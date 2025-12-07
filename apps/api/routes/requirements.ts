import { Hono } from 'hono';
import db from '../db';
import type { StaffingRequirement, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', (c) => {
  const user = c.get('user');
  const areaId = c.req.query('areaId');
  const locationId = c.req.query('locationId');

  let query = "SELECT * FROM requirements WHERE org_id = ?";
  const params = [user.orgId];

  if (areaId) {
    query += " AND area_id = ?";
    params.push(areaId);
  } else if (locationId) {
    query += " AND location_id = ?";
    params.push(locationId);
  }

  const reqs = db.query(query).all(...params) as any[];
  
  return c.json(reqs.map(r => ({
    id: r.id,
    areaId: r.area_id,
    dayOfWeek: r.day_of_week,
    roleId: r.role_id,
    count: r.count,
    orgId: r.org_id,
    locationId: r.location_id
  })));
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { areaId, dayOfWeek, roleId, count } = body;

  const area = db.query("SELECT location_id FROM areas WHERE id = ?").get(areaId) as any;
  if (!area) {
    return c.json({ error: 'Area not found' }, 404);
  }

  const newRequirement: StaffingRequirement = {
    id: `req-${Date.now()}`,
    areaId,
    dayOfWeek,
    roleId,
    count: Number(count),
    orgId: user.orgId,
    locationId: area.location_id,
  };

  db.query("INSERT INTO requirements (id, area_id, day_of_week, role_id, count, org_id, location_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    newRequirement.id, newRequirement.areaId, newRequirement.dayOfWeek, newRequirement.roleId, newRequirement.count, newRequirement.orgId, newRequirement.locationId
  );

  return c.json(newRequirement);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { count } = body;

  const result = db.query("UPDATE requirements SET count = ? WHERE id = ? AND org_id = ?").run(count, id, user.orgId);

  if (result.changes === 0) {
    return c.json({ error: 'Requirement not found' }, 404);
  }

  const updated = db.query("SELECT * FROM requirements WHERE id = ?").get(id) as any;
  return c.json({
    id: updated.id,
    areaId: updated.area_id,
    dayOfWeek: updated.day_of_week,
    roleId: updated.role_id,
    count: updated.count,
    orgId: updated.org_id,
    locationId: updated.location_id
  });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const result = db.query("DELETE FROM requirements WHERE id = ? AND org_id = ?").run(id, user.orgId);
  
  if (result.changes === 0) {
    return c.json({ error: 'Requirement not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
