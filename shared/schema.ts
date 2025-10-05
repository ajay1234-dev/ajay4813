import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("patient"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  language: text("language").default("en"),
  authProvider: text("auth_provider").default("email"),
  firebaseUid: text("firebase_uid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  reportType: text("report_type").notNull(), // blood_test, prescription, x-ray, etc.
  originalText: text("original_text"),
  extractedData: jsonb("extracted_data"), // structured medical data
  analysis: jsonb("analysis"), // AI analysis results
  summary: text("summary"), // plain language summary
  status: text("status").default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reportId: varchar("report_id").references(() => reports.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(), // daily, twice_daily, etc.
  instructions: text("instructions"),
  sideEffects: text("side_effects"),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  medicationId: varchar("medication_id").references(() => medications.id),
  type: text("type").notNull(), // medication, appointment, refill
  title: text("title").notNull(),
  message: text("message"),
  scheduledTime: timestamp("scheduled_time").notNull(),
  isCompleted: boolean("is_completed").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthTimeline = pgTable("health_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reportId: varchar("report_id").references(() => reports.id),
  date: timestamp("date").notNull(),
  eventType: text("event_type").notNull(), // lab_result, medication_change, appointment
  title: text("title").notNull(),
  description: text("description"),
  metrics: jsonb("metrics"), // blood pressure, sugar levels, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sharedReports = pgTable("shared_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reportIds: text("report_ids").array(), // array of report IDs
  shareToken: text("share_token").notNull().unique(),
  doctorEmail: text("doctor_email"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertHealthTimelineSchema = createInsertSchema(healthTimeline).omit({
  id: true,
  createdAt: true,
});

export const insertSharedReportSchema = createInsertSchema(sharedReports).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertHealthTimeline = z.infer<typeof insertHealthTimelineSchema>;
export type HealthTimeline = typeof healthTimeline.$inferSelect;
export type InsertSharedReport = z.infer<typeof insertSharedReportSchema>;
export type SharedReport = typeof sharedReports.$inferSelect;
