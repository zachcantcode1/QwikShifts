import { Hono } from 'hono';
import db from '../db';
import { Area, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', (c) => {
  const user = c.get('user');
  const locationId = c.req.query('locationId');
  
  let query = "SELECT * FROM areas WHERE org_id = ?";
  const params = [user.orgId];

  if (locationId) {
    query += " AND location_id = ?";
    params.push(locationId);
  }

  const areas = db.query(query).all(...params) as any[];
  
  return c.json(areas.map(a => ({
    id: a.id,
    name: a.name,
    color: a.color,
    orgId: a.org_id,
    locationId: a.location_id
  })));
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, color, locationId } = body;

  if (!locationId) {
    return c.json({ error: 'Location ID is required' }, 400);
  }

  const newArea: Area = {
    id: `area-${Date.now()}`,
    name,
    color: color || '#3b82f6',
    orgId: user.orgId,
    locationId,
  };

  db.query("INSERT INTO areas (id, name, color, org_id, location_id) VALUES (?, ?, ?, ?, ?)").run(
    newArea.id, newArea.name, newArea.color, newArea.orgId, newArea.locationId
  );

  return c.json(newArea);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, color } = body;

  const result = db.query("UPDATE areas SET name = ?, color = ? WHERE id = ? AND org_id = ?").run(name, color, id, user.orgId);

  if (result.changes === 0) {
    return c.json({ error: 'Area not found' }, 404);
  }

  const updated = db.query("SELECT * FROM areas WHERE id = ?").get(id) as any;
  return c.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    orgId: updated.org_id,
    locationId: updated.location_id
  });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const result = db.query("DELETE FROM areas WHERE id = ? AND org_id = ?").run(id, user.orgId);
  
  if (result.changes === 0) {
    return c.json({ error: 'Area not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
