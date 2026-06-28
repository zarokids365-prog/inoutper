import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  personnelCode: varchar("personnel_code", { length: 50 }).notNull().unique(),
  position: varchar("position", { length: 255 }).notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Weekly schedules - one row per employee per day of week
// dayOfWeek: 0=شنبه(Sat), 1=یکشنبه(Sun), 2=دوشنبه(Mon), 3=سه‌شنبه(Tue), 4=چهارشنبه(Wed), 5=پنجشنبه(Thu), 6=جمعه(Fri)
export const weeklySchedules = pgTable("weekly_schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM
  isDayOff: boolean("is_day_off").notNull().default(false),
});

// Attendance records
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  dateJalali: varchar("date_jalali", { length: 10 }).notNull(), // 1403/01/15
  checkIn: varchar("check_in", { length: 5 }), // HH:MM
  checkOut: varchar("check_out", { length: 5 }), // HH:MM
  status: varchar("status", { length: 20 }).notNull().default("present"), // present, leave, dayoff, absent
  delayMinutes: integer("delay_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  deficitMinutes: integer("deficit_minutes").notNull().default(0),
  totalWorkedMinutes: integer("total_worked_minutes").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Special days (personal day off, leave, special working hours on holidays)
export const specialDays = pgTable("special_days", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  dateJalali: varchar("date_jalali", { length: 10 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // personal_off, leave, special_work
  startTime: varchar("start_time", { length: 5 }), // only for special_work
  endTime: varchar("end_time", { length: 5 }), // only for special_work
  description: text("description"),
});

// Settings table - key/value
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull().default(""),
});

// Backup logs
export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  backupDate: timestamp("backup_date").notNull().defaultNow(),
  filePath: text("file_path").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("success"),
  errorMessage: text("error_message"),
});
