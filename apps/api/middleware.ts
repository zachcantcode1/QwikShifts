import { createMiddleware } from 'hono/factory';
import db from './db';
import type { User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const userId = c.req.header('x-demo-user-id');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const dbUser = db.query("SELECT * FROM users WHERE id = ?").get(userId) as any;

  if (!dbUser) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user: User = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role as 'manager' | 'employee',
    orgId: dbUser.org_id
  };

  c.set('user', user);
  await next();
});

export const managerMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'manager') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
});
