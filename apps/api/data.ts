import type { User, Organization, EmployeeProfile, Role, Area, Location } from '@qwikshifts/core';

export const DEMO_ORG: Organization = {
  id: 'org-1',
  name: 'Demo Org',
};

export const DEMO_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Main Ship', orgId: DEMO_ORG.id },
  { id: 'loc-2', name: 'Second Ship', orgId: DEMO_ORG.id },
];

export const DEMO_ROLES: Role[] = [
  { id: 'role-1', name: 'Server', color: 'blue', orgId: DEMO_ORG.id },
  { id: 'role-2', name: 'Cook', color: 'red', orgId: DEMO_ORG.id },
  { id: 'role-3', name: 'Bartender', color: 'green', orgId: DEMO_ORG.id },
];

export const DEMO_AREAS: Area[] = [
  { id: 'area-2', name: 'Patio', color: 'green', orgId: DEMO_ORG.id, locationId: 'loc-1' },
  { id: 'area-3', name: 'Kitchen', color: 'red', orgId: DEMO_ORG.id, locationId: 'loc-1' },
  { id: 'area-4', name: 'Deck', color: 'orange', orgId: DEMO_ORG.id, locationId: 'loc-2' },
  { id: 'area-5', name: 'Galley', color: 'purple', orgId: DEMO_ORG.id, locationId: 'loc-2' },
];

export const DEMO_USERS: User[] = [
  {
    id: 'user-manager',
    email: 'manager@demo.com',
    name: 'Alice Manager',
    role: 'manager',
    orgId: DEMO_ORG.id,
  },
  {
    id: 'user-employee',
    email: 'employee@demo.com',
    name: 'Bob Employee',
    role: 'employee',
    orgId: DEMO_ORG.id,
  },
  {
    id: 'user-employee-2',
    email: 'employee2@demo.com',
    name: 'Charlie Employee',
    role: 'employee',
    orgId: DEMO_ORG.id,
  },
];

export const DEMO_EMPLOYEES: EmployeeProfile[] = [
  {
    id: 'emp-1',
    userId: 'user-manager',
    orgId: DEMO_ORG.id,
    locationId: 'loc-1',
    roleIds: ['role-1'],
    weeklyHoursLimit: 40,
  },
  {
    id: 'emp-2',
    userId: 'user-employee',
    orgId: DEMO_ORG.id,
    locationId: 'loc-1',
    roleIds: ['role-1', 'role-2'],
    weeklyHoursLimit: 30,
  },
  {
    id: 'emp-3',
    userId: 'user-employee-2',
    orgId: DEMO_ORG.id,
    locationId: 'loc-2',
    roleIds: ['role-2', 'role-3'],
    weeklyHoursLimit: 40,
  },
];

import type { Shift, ShiftAssignment, Rule, StaffingRequirement } from '@qwikshifts/core';

export const DEMO_RULES: Rule[] = [
  {
    id: 'rule-1',
    name: 'Standard Full Time',
    type: 'MAX_HOURS',
    value: 40,
    orgId: DEMO_ORG.id,
  },
  {
    id: 'rule-2',
    name: 'Part Time Limit',
    type: 'MAX_HOURS',
    value: 20,
    orgId: DEMO_ORG.id,
  },
];

export const DEMO_SHIFTS: Shift[] = [
   {
    id: 'shift-3',
    areaId: 'area-2',
    date: '2025-12-06',
    startTime: '10:00',
    endTime: '18:00',
    orgId: DEMO_ORG.id,
    locationId: 'loc-1',
  },
];

export const DEMO_ASSIGNMENTS: ShiftAssignment[] = [];

export const DEMO_REQUIREMENTS: StaffingRequirement[] = [];

import type { TimeOffRequest } from '@qwikshifts/core';

export const DEMO_TIME_OFF_REQUESTS: TimeOffRequest[] = [];