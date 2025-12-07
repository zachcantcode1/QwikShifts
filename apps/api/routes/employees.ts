import { Hono } from 'hono';
import db from '../db';
import type { EmployeeWithRoles, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', (c) => {
  const user = c.get('user');
  const locationId = c.req.query('locationId');
  
  let query = `
    SELECT e.*, u.name as user_name, u.email as user_email, r.value as rule_value
    FROM employees e 
    JOIN users u ON e.user_id = u.id 
    LEFT JOIN rules r ON e.rule_id = r.id
    WHERE e.org_id = ?
  `;
  const params = [user.orgId];

  if (locationId) {
    query += " AND e.location_id = ?";
    params.push(locationId);
  }

  const employees = db.query(query).all(...params) as any[];

  const result = employees.map(emp => {
    const roles = db.query(`
      SELECT r.* FROM roles r 
      JOIN employee_roles er ON r.id = er.role_id 
      WHERE er.employee_id = ?
    `).all(emp.id) as any[];

    return {
      id: emp.id,
      userId: emp.user_id,
      orgId: emp.org_id,
      locationId: emp.location_id,
      weeklyHoursLimit: emp.weekly_hours_limit || emp.rule_value,
      ruleId: emp.rule_id,
      user: { name: emp.user_name, email: emp.user_email },
      roles: roles.map(r => ({ id: r.id, name: r.name, color: r.color, orgId: r.org_id })),
      roleIds: roles.map(r => r.id)
    };
  });

  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, email, roleIds, ruleId, locationId } = body;

  if (!locationId) {
    return c.json({ error: 'Location ID is required' }, 400);
  }

  const newUserId = `user-${Date.now()}`;
  const newEmployeeId = `emp-${Date.now()}`;

  try {
    db.transaction(() => {
      db.query("INSERT INTO users (id, email, name, role, org_id) VALUES (?, ?, ?, ?, ?)").run(
        newUserId, email, name, 'employee', user.orgId
      );

      db.query("INSERT INTO employees (id, user_id, org_id, location_id, weekly_hours_limit, rule_id) VALUES (?, ?, ?, ?, ?, ?)").run(
        newEmployeeId, newUserId, user.orgId, locationId, null, ruleId || null
      );

      if (roleIds && roleIds.length > 0) {
        const insertRole = db.prepare("INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)");
        for (const roleId of roleIds) {
          insertRole.run(newEmployeeId, roleId);
        }
      }
    })();
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return c.json({ error: 'Failed to create employee', details: error.message }, 500);
  }

  const roles = roleIds && roleIds.length > 0 
    ? db.query(`SELECT * FROM roles WHERE id IN (${roleIds.map(() => '?').join(',')})`).all(...roleIds) 
    : [];

  return c.json({
    id: newEmployeeId,
    userId: newUserId,
    orgId: user.orgId,
    locationId,
    roleIds: roleIds || [],
    ruleId,
    user: { name, email },
    roles: roles.map((r: any) => ({ id: r.id, name: r.name, color: r.color, orgId: r.org_id }))
  });
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, email, roleIds, ruleId } = body;

  const emp = db.query("SELECT * FROM employees WHERE id = ? AND org_id = ?").get(id, user.orgId) as any;
  if (!emp) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  db.transaction(() => {
    db.query("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, emp.user_id);
    db.query("UPDATE employees SET rule_id = ? WHERE id = ?").run(ruleId, id);

    db.query("DELETE FROM employee_roles WHERE employee_id = ?").run(id);
    if (roleIds && roleIds.length > 0) {
      const insertRole = db.prepare("INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)");
      for (const roleId of roleIds) {
        insertRole.run(id, roleId);
      }
    }
  })();

  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const emp = db.query("SELECT * FROM employees WHERE id = ? AND org_id = ?").get(id, user.orgId) as any;
  if (!emp) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  db.transaction(() => {
    db.query("DELETE FROM employees WHERE id = ?").run(id);
    db.query("DELETE FROM users WHERE id = ?").run(emp.user_id);
  })();

  return c.json({ success: true });
});

export default app;
