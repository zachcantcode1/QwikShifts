import { Hono } from 'hono';
import db from '../db';
import type { User, Location } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', (c) => {
  const user = c.get('user');
  const locations = db.query("SELECT * FROM locations WHERE org_id = ?").all(user.orgId) as any[];
  
  return c.json(locations.map(l => ({
    id: l.id,
    name: l.name,
    orgId: l.org_id
  })));
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name } = body;

  const newLocation: Location = {
    id: `loc-${Date.now()}`,
    name,
    orgId: user.orgId,
  };

  db.query("INSERT INTO locations (id, name, org_id) VALUES (?, ?, ?)").run(
    newLocation.id, 
    newLocation.name, 
    newLocation.orgId
  );
  
  return c.json(newLocation);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name } = body;

  const result = db.query("UPDATE locations SET name = ? WHERE id = ? AND org_id = ?").run(name, id, user.orgId);

  if (result.changes === 0) {
    return c.json({ error: 'Location not found' }, 404);
  }

  return c.json({
    id,
    name,
    orgId: user.orgId,
  });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const result = db.query("DELETE FROM locations WHERE id = ? AND org_id = ?").run(id, user.orgId);
  
  if (result.changes === 0) {
    return c.json({ error: 'Location not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
