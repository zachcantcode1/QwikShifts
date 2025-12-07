import { Database } from "bun:sqlite";

const db = new Database("qwikshifts.sqlite");

// Enable WAL mode for better concurrency
db.run("PRAGMA journal_mode = WAL;");
// Enable Foreign Keys
db.run("PRAGMA foreign_keys = ON;");

export function initDb() {
  // Organizations
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      onboarding_step INTEGER DEFAULT 1
    );
  `);
  
  try {
    db.run("ALTER TABLE organizations ADD COLUMN onboarding_step INTEGER DEFAULT 1");
  } catch (e) {
    // Column likely already exists
  }

  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      org_id TEXT,
      FOREIGN KEY(org_id) REFERENCES organizations(id)
    );
  `);

  // Locations
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org_id TEXT NOT NULL,
      FOREIGN KEY(org_id) REFERENCES organizations(id)
    );
  `);

  // Areas
  db.run(`
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      org_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      FOREIGN KEY(org_id) REFERENCES organizations(id),
      FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE
    );
  `);

  // Roles
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      org_id TEXT NOT NULL,
      FOREIGN KEY(org_id) REFERENCES organizations(id)
    );
  `);

  // Rules
  db.run(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value INTEGER NOT NULL,
      org_id TEXT NOT NULL,
      FOREIGN KEY(org_id) REFERENCES organizations(id)
    );
  `);

  // Employees (Profiles)
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      weekly_hours_limit INTEGER,
      rule_id TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(org_id) REFERENCES organizations(id),
      FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE
    );
  `);

  // Employee Roles (Many-to-Many)
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_roles (
      employee_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (employee_id, role_id),
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
  `);

  // Shifts
  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      area_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      org_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      FOREIGN KEY(area_id) REFERENCES areas(id) ON DELETE CASCADE,
      FOREIGN KEY(org_id) REFERENCES organizations(id),
      FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE
    );
  `);

  // Assignments
  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      role_id TEXT,
      FOREIGN KEY(shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY(role_id) REFERENCES roles(id)
    );
  `);

  // Requirements
  db.run(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      area_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      role_id TEXT NOT NULL,
      count INTEGER NOT NULL,
      org_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      FOREIGN KEY(area_id) REFERENCES areas(id) ON DELETE CASCADE,
      FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY(org_id) REFERENCES organizations(id),
      FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE
    );
  `);
}

export default db;
