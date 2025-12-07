import { Hono } from 'hono';
import { DEMO_TIME_OFF_REQUESTS, DEMO_EMPLOYEES, DEMO_USERS } from '../data';
import { TimeOffRequest, User, TimeOffRequestWithEmployee } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

// Get all requests (Manager view)
app.get('/', (c) => {
  const user = c.get('user');
  // In a real app, check if user is manager
  
  const requestsWithEmployee: TimeOffRequestWithEmployee[] = DEMO_TIME_OFF_REQUESTS.map(req => {
    const employee = DEMO_EMPLOYEES.find(e => e.id === req.employeeId);
    const employeeUser = employee ? DEMO_USERS.find(u => u.id === employee.userId) : null;
    
    return {
      ...req,
      employee: {
        ...employee!,
        user: {
          name: employeeUser?.name || 'Unknown',
          email: employeeUser?.email || 'unknown@example.com',
        }
      }
    };
  });

  return c.json(requestsWithEmployee);
});

// Get my requests (Employee view)
app.get('/my', (c) => {
  const user = c.get('user');
  const employee = DEMO_EMPLOYEES.find(e => e.userId === user.id);
  
  if (!employee) return c.json([]);

  const myRequests = DEMO_TIME_OFF_REQUESTS.filter(r => r.employeeId === employee.id);
  return c.json(myRequests);
});

// Create request
app.post('/', async (c) => {
  const user = c.get('user');
  const employee = DEMO_EMPLOYEES.find(e => e.userId === user.id);
  
  if (!employee) return c.json({ error: 'Employee not found' }, 404);

  const body = await c.req.json();
  const { date, isFullDay, startTime, endTime, reason } = body;

  const newRequest: TimeOffRequest = {
    id: `req-${Date.now()}`,
    employeeId: employee.id,
    date,
    isFullDay,
    startTime,
    endTime,
    reason,
    status: 'pending',
    orgId: employee.orgId,
  };

  DEMO_TIME_OFF_REQUESTS.push(newRequest);
  return c.json(newRequest);
});

// Update status (Manager action)
app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  const requestIndex = DEMO_TIME_OFF_REQUESTS.findIndex(r => r.id === id);
  if (requestIndex === -1) return c.json({ error: 'Request not found' }, 404);

  DEMO_TIME_OFF_REQUESTS[requestIndex] = {
    ...DEMO_TIME_OFF_REQUESTS[requestIndex],
    status,
  };

  return c.json(DEMO_TIME_OFF_REQUESTS[requestIndex]);
});

export default app;
