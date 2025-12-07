import { Database } from "bun:sqlite";
const db = new Database("apps/api/qwikshifts.sqlite");
console.log(db.query("PRAGMA table_info(users)").all());
