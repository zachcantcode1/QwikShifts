import { Hono } from 'hono';
import db from '../db';

const app = new Hono();

app.get('/status', (c) => {
  const org = db.query("SELECT * FROM organizations LIMIT 1").get() as any;
  if (!org) {
    return c.json({ onboarded: false, step: 1 });
  }
  // Assuming step 5 is the last step, so > 5 means done.
  // Actually, let's say step 6 is "completed".
  return c.json({ onboarded: (org.onboarding_step || 1) > 5, step: org.onboarding_step || 1 });
});

app.post('/progress', async (c) => {
  const { step } = await c.req.json();
  const org = db.query("SELECT id FROM organizations LIMIT 1").get() as any;
  if (org) {
    db.query("UPDATE organizations SET onboarding_step = ? WHERE id = ?").run(step, org.id);
  }
  return c.json({ success: true });
});

app.post('/setup', async (c) => {
  const { orgName, managerName, managerEmail } = await c.req.json();
  
  // Check if user already exists
  const existingUser = db.query("SELECT * FROM users WHERE email = ?").get(managerEmail);
  if (existingUser) {
    return c.json({ error: 'A user with this email already exists.' }, 400);
  }
  
  const orgId = `org-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const locationId = `loc-${Date.now()}`;
  const employeeId = `emp-${Date.now()}`;
  
  try {
    db.transaction(() => {
      db.query("INSERT INTO organizations (id, name, onboarding_step) VALUES (?, ?, 2)").run(orgId, orgName);
      db.query("INSERT INTO users (id, email, name, role, org_id) VALUES (?, ?, ?, ?, ?)").run(
        userId, managerEmail, managerName, 'manager', orgId
      );
      // Create default location
      db.query("INSERT INTO locations (id, name, org_id) VALUES (?, ?, ?)").run(
        locationId, "Main Location", orgId
      );
      // Create employee profile for manager
      db.query("INSERT INTO employees (id, user_id, org_id, location_id, weekly_hours_limit, rule_id) VALUES (?, ?, ?, ?, ?, ?)").run(
        employeeId, userId, orgId, locationId, null, null
      );
    })();
    
    return c.json({ 
      success: true, 
      user: { 
        id: userId, 
        name: managerName, 
        email: managerEmail, 
        role: 'manager', 
        orgId 
      } 
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ error: 'Failed to setup organization', details: error.message }, 500);
  }
});

export default app;
