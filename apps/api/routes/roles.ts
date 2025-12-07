import { Hono } from 'hono';
import db from '../db';
import type { Role, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', (c) => {
  const user = c.get('user');
  const roles = db.query("SELECT * FROM roles WHERE org_id = ?").all(user.orgId) as any[];
  
  return c.json(roles.map(r => ({
    id: r.id,
    name: r.name,
    color: r.color,
    orgId: r.org_id
  })));
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, color } = body;

  const newRole: Role = {
    id: `role-${Date.now()}`,
    name,
    color: color || '#3b82f6',
    orgId: user.orgId,
  };

  db.query("INSERT INTO roles (id, name, color, org_id) VALUES (?, ?, ?, ?)").run(
    newRole.id, newRole.name, newRole.color, newRole.orgId
  );

  return c.json(newRole);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, color } = body;

  const result = db.query("UPDATE roles SET name = ?, color = ? WHERE id = ? AND org_id = ?").run(name, color, id, user.orgId);

  if (result.changes === 0) {
    return c.json({ error: 'Role not found' }, 404);
  }

  const updated = db.query("SELECT * FROM roles WHERE id = ?").get(id) as any;
  return c.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    orgId: updated.org_id
  });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const result = db.query("DELETE FROM roles WHERE id = ? AND org_id = ?").run(id, user.orgId);
  
  if (result.changes === 0) {
    return c.json({ error: 'Role not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
