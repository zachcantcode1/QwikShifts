import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import db from '../db';
import { users, organizations } from '../schema';
import { eq } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';
import { authMiddleware } from '../middleware';

const app = new Hono<{ Variables: { user: User } }>();

console.log('Auth Routes Loaded');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

app.get('/test', (c) => c.json({ message: 'Auth route working' }));

app.post('/login', async (c) => {
  console.log('Login request received');
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  // In a real app we would check password here
  // For now this is "Magic Link" style without the link (Development only)

  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const token = await sign(payload, JWT_SECRET);

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
    }
  });
});

app.post('/register', async (c) => {
  console.log('Register request received');
  const { email, name } = await c.req.json();

  if (!email || !name) {
    return c.json({ error: 'Email and Name are required' }, 400);
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400);
  }

  // Create Organization (Default name based on email for now, user updates in Onboarding)
  const orgId = crypto.randomUUID();
  const orgName = `${email.split('@')[0]}'s Organization`;

  await db.insert(organizations).values({
    id: orgId,
    name: orgName,
    onboardingStep: 1, // Start at step 1
  });

  // Create User
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    email: email,
    name: name, // Use provided name
    role: 'manager', // First user is manager
    orgId: orgId,
  });

  const payload = {
    sub: userId,
    name: name,
    role: 'manager',
    orgId: orgId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const token = await sign(payload, JWT_SECRET);

  return c.json({
    token,
    user: {
      id: userId,
      email,
      name,
      role: 'manager',
      orgId,
    }
  });
});

app.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default app;
