import { Hono } from 'hono';
import db from '../db';
import { Rule, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', (c) => {
  const user = c.get('user');
  const rules = db.query("SELECT * FROM rules WHERE org_id = ?").all(user.orgId) as any[];
  
  return c.json(rules.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    value: r.value,
    orgId: r.org_id
  })));
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, value } = body;

  const newRule: Rule = {
    id: `rule-${Date.now()}`,
    name,
    type: 'MAX_HOURS',
    value: Number(value),
    orgId: user.orgId,
  };

  db.query("INSERT INTO rules (id, name, type, value, org_id) VALUES (?, ?, ?, ?, ?)").run(
    newRule.id, newRule.name, newRule.type, newRule.value, newRule.orgId
  );

  return c.json(newRule);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, value } = body;

  db.query("UPDATE rules SET name = ?, value = ? WHERE id = ?").run(name, Number(value), id);

  const updatedRule = db.query("SELECT * FROM rules WHERE id = ?").get(id) as any;
  
  if (!updatedRule) {
    return c.json({ error: 'Rule not found' }, 404);
  }

  return c.json({
    id: updatedRule.id,
    name: updatedRule.name,
    type: updatedRule.type,
    value: updatedRule.value,
    orgId: updatedRule.org_id
  });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  db.query("DELETE FROM rules WHERE id = ?").run(id);
  return c.json({ success: true });
});

export default app;
