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
  type InsertSharedReport
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllPatients(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Reports
  getReport(id: string): Promise<Report | undefined>;
  getUserReports(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined>;

  // Medications
  getMedication(id: string): Promise<Medication | undefined>;
  getUserMedications(userId: string): Promise<Medication[]>;
  getActiveMedications(userId: string): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | undefined>;

  // Reminders
  getReminder(id: string): Promise<Reminder | undefined>;
  getUserReminders(userId: string): Promise<Reminder[]>;
  getActiveReminders(userId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined>;

  // Health Timeline
  getUserHealthTimeline(userId: string): Promise<HealthTimeline[]>;
  createHealthTimelineEntry(entry: InsertHealthTimeline): Promise<HealthTimeline>;

  // Shared Reports
  getSharedReport(token: string): Promise<SharedReport | undefined>;
  createSharedReport(sharedReport: InsertSharedReport): Promise<SharedReport>;
  updateSharedReport(id: string, updates: Partial<SharedReport>): Promise<SharedReport | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private reports: Map<string, Report> = new Map();
  private medications: Map<string, Medication> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private healthTimeline: Map<string, HealthTimeline> = new Map();
  private sharedReports: Map<string, SharedReport> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllPatients(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === 'patient');
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: insertUser.role || 'patient',
      dateOfBirth: insertUser.dateOfBirth || null,
      phone: insertUser.phone || null,
      language: insertUser.language || null,
      authProvider: insertUser.authProvider || null,
      firebaseUid: insertUser.firebaseUid || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Reports
  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getUserReports(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      id,
      userId: insertReport.userId,
      fileName: insertReport.fileName,
      fileUrl: insertReport.fileUrl,
      reportType: insertReport.reportType,
      originalText: insertReport.originalText || null,
      extractedData: insertReport.extractedData || null,
      analysis: insertReport.analysis || null,
      summary: insertReport.summary || null,
      status: insertReport.status || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...updates, updatedAt: new Date() };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  // Medications
  async getMedication(id: string): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async getUserMedications(userId: string): Promise<Medication[]> {
    return Array.from(this.medications.values())
      .filter(medication => medication.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getActiveMedications(userId: string): Promise<Medication[]> {
    return Array.from(this.medications.values())
      .filter(medication => medication.userId === userId && medication.isActive);
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const id = randomUUID();
    const medication: Medication = {
      id,
      userId: insertMedication.userId,
      reportId: insertMedication.reportId || null,
      name: insertMedication.name,
      dosage: insertMedication.dosage,
      frequency: insertMedication.frequency,
      instructions: insertMedication.instructions || null,
      sideEffects: insertMedication.sideEffects || null,
      isActive: insertMedication.isActive || null,
      startDate: insertMedication.startDate || null,
      endDate: insertMedication.endDate || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.medications.set(id, medication);
    return medication;
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | undefined> {
    const medication = this.medications.get(id);
    if (!medication) return undefined;
    
    const updatedMedication = { ...medication, ...updates, updatedAt: new Date() };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }

  // Reminders
  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.userId === userId)
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }

  async getActiveReminders(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.userId === userId && reminder.isActive && !reminder.isCompleted);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      id,
      userId: insertReminder.userId,
      medicationId: insertReminder.medicationId || null,
      type: insertReminder.type,
      title: insertReminder.title,
      message: insertReminder.message || null,
      scheduledTime: insertReminder.scheduledTime,
      isCompleted: insertReminder.isCompleted || null,
      isActive: insertReminder.isActive || null,
      createdAt: new Date()
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;
    
    const updatedReminder = { ...reminder, ...updates };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  // Health Timeline
  async getUserHealthTimeline(userId: string): Promise<HealthTimeline[]> {
    return Array.from(this.healthTimeline.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createHealthTimelineEntry(insertEntry: InsertHealthTimeline): Promise<HealthTimeline> {
    const id = randomUUID();
    const entry: HealthTimeline = {
      id,
      userId: insertEntry.userId,
      reportId: insertEntry.reportId || null,
      date: insertEntry.date,
      eventType: insertEntry.eventType,
      title: insertEntry.title,
      description: insertEntry.description || null,
      metrics: insertEntry.metrics || null,
      notes: insertEntry.notes || null,
      createdAt: new Date()
    };
    this.healthTimeline.set(id, entry);
    return entry;
  }

  // Shared Reports
  async getSharedReport(token: string): Promise<SharedReport | undefined> {
    return Array.from(this.sharedReports.values())
      .find(shared => shared.shareToken === token);
  }

  async createSharedReport(insertSharedReport: InsertSharedReport): Promise<SharedReport> {
    const id = randomUUID();
    const sharedReport: SharedReport = {
      id,
      userId: insertSharedReport.userId,
      reportIds: insertSharedReport.reportIds || null,
      shareToken: insertSharedReport.shareToken,
      doctorEmail: insertSharedReport.doctorEmail || null,
      expiresAt: insertSharedReport.expiresAt,
      isActive: insertSharedReport.isActive || null,
      viewCount: insertSharedReport.viewCount || null,
      createdAt: new Date()
    };
    this.sharedReports.set(id, sharedReport);
    return sharedReport;
  }

  async updateSharedReport(id: string, updates: Partial<SharedReport>): Promise<SharedReport | undefined> {
    const sharedReport = this.sharedReports.get(id);
    if (!sharedReport) return undefined;
    
    const updatedSharedReport = { ...sharedReport, ...updates };
    this.sharedReports.set(id, updatedSharedReport);
    return updatedSharedReport;
  }
}

export const storage = new MemStorage();
