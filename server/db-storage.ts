import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';
import {
  type User,
  type InsertUser,
  type Report,
  type InsertReport,
  type Medication,
  type InsertMedication,
  type Reminder,
  type InsertReminder,
  type HealthTimeline,
  type InsertHealthTimeline,
  type SharedReport,
  type InsertSharedReport,
  users,
  reports,
  medications,
  reminders,
  healthTimeline,
  sharedReports
} from '@shared/schema';
import type { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Reports
  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    return result[0];
  }

  async getUserReports(userId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const result = await db.update(reports).set(updates).where(eq(reports.id, id)).returning();
    return result[0];
  }

  // Medications
  async getMedication(id: string): Promise<Medication | undefined> {
    const result = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
    return result[0];
  }

  async getUserMedications(userId: string): Promise<Medication[]> {
    return await db.select().from(medications).where(eq(medications.userId, userId)).orderBy(desc(medications.createdAt));
  }

  async getActiveMedications(userId: string): Promise<Medication[]> {
    return await db.select().from(medications).where(
      and(eq(medications.userId, userId), eq(medications.isActive, true))
    ).orderBy(desc(medications.createdAt));
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const result = await db.insert(medications).values(medication).returning();
    return result[0];
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | undefined> {
    const result = await db.update(medications).set(updates).where(eq(medications.id, id)).returning();
    return result[0];
  }

  // Reminders
  async getReminder(id: string): Promise<Reminder | undefined> {
    const result = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1);
    return result[0];
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt));
  }

  async getActiveReminders(userId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(
      and(eq(reminders.userId, userId), eq(reminders.isActive, true))
    ).orderBy(desc(reminders.scheduledTime));
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const result = await db.insert(reminders).values(reminder).returning();
    return result[0];
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const result = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
    return result[0];
  }

  // Health Timeline
  async getUserHealthTimeline(userId: string): Promise<HealthTimeline[]> {
    return await db.select().from(healthTimeline).where(eq(healthTimeline.userId, userId)).orderBy(desc(healthTimeline.date));
  }

  async createHealthTimelineEntry(entry: InsertHealthTimeline): Promise<HealthTimeline> {
    const result = await db.insert(healthTimeline).values(entry).returning();
    return result[0];
  }

  // Shared Reports
  async getSharedReport(token: string): Promise<SharedReport | undefined> {
    const result = await db.select().from(sharedReports).where(eq(sharedReports.shareToken, token)).limit(1);
    return result[0];
  }

  async createSharedReport(sharedReport: InsertSharedReport): Promise<SharedReport> {
    const result = await db.insert(sharedReports).values(sharedReport).returning();
    return result[0];
  }

  async updateSharedReport(id: string, updates: Partial<SharedReport>): Promise<SharedReport | undefined> {
    const result = await db.update(sharedReports).set(updates).where(eq(sharedReports.id, id)).returning();
    return result[0];
  }
}