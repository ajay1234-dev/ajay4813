import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertReportSchema, insertMedicationSchema, insertReminderSchema } from "@shared/schema";
import { analyzeMedicalReport, extractMedicationInfo, generateHealthSummary, translateMedicalText } from "./services/gemini";
import { extractTextFromImage, extractTextFromPDF, detectDocumentType } from "./services/ocr";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure SESSION_SECRET is set for security
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required for secure session management');
  }

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      
      res.json({ 
        message: 'User created successfully', 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      
      res.json({ 
        message: 'Login successful', 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        language: user.language 
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Reports routes
  app.post('/api/reports/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileId = randomUUID();
      const fileName = req.file.originalname;
      const fileUrl = `/uploads/${fileId}_${fileName}`;

      // Create report immediately without processing
      const report = await storage.createReport({
        userId: req.session.userId,
        fileName,
        fileUrl,
        reportType: 'general', // Will be updated after processing
        originalText: '', // Will be updated after processing
        status: 'processing',
      });

      // Process in background (don't await this)
      processReportAsync(report.id, req.file.buffer, req.file.mimetype).catch(error => {
        console.error('Background processing failed for report', report.id, ':', error);
        // Update report status to failed
        storage.updateReport(report.id, {
          status: 'failed',
          summary: 'Processing failed due to technical error'
        }).catch(updateError => {
          console.error('Failed to update report status:', updateError);
        });
      });

      // Respond immediately to prevent timeout
      res.json({ message: 'File uploaded successfully', reportId: report.id });
    } catch (error) {
      console.error('Upload route error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Upload failed' });
    }
  });

  // Background processing function
  async function processReportAsync(reportId: string, fileBuffer: Buffer, mimeType: string) {
    try {
      console.log(`Starting background processing for report ${reportId}`);
      
      // Extract text based on file type with proper error handling
      let extractedText = '';
      let reportType = 'general';
      let extractionFailed = false;
      
      try {
        if (mimeType === 'application/pdf') {
          console.log('Processing PDF...');
          extractedText = await extractTextFromPDF(fileBuffer);
        } else {
          console.log('Processing image with OCR...');
          const ocrResult = await extractTextFromImage(fileBuffer);
          extractedText = ocrResult.text;
        }
        
        if (extractedText && extractedText.length > 0) {
          reportType = detectDocumentType(extractedText);
          console.log(`Detected document type: ${reportType}`);
        }
      } catch (error) {
        console.error('Text extraction failed:', error);
        extractionFailed = true;
        extractedText = error instanceof Error ? error.message : 'Text extraction failed';
      }

      // Update report with extracted text
      await storage.updateReport(reportId, {
        originalText: extractedText,
        reportType: reportType,
      });

      let analysis = null;
      let extractedData = null;
      let summary = '';

      // Process analysis based on document type
      try {
        if (reportType === 'blood_test' || reportType === 'general') {
          console.log('Running medical analysis...');
          analysis = await analyzeMedicalReport(extractedText);
          summary = analysis.summary;
          extractedData = analysis;
        } else if (reportType === 'prescription') {
          console.log('Extracting medication info...');
          const medications = await extractMedicationInfo(extractedText);
          extractedData = { medications };
          summary = `Prescription contains ${medications.length} medication(s)`;
          
          // Create medication entries
          const report = await storage.getReport(reportId);
          if (report) {
            for (const med of medications) {
              try {
                await storage.createMedication({
                  userId: report.userId,
                  reportId: report.id,
                  name: med.name,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  instructions: med.instructions,
                  sideEffects: med.sideEffects?.join(', ') || '',
                  isActive: true,
                });
              } catch (medError) {
                console.error('Failed to create medication:', medError);
              }
            }
          }
        }
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError);
        summary = 'Document processed successfully. Professional medical review recommended.';
        extractedData = { message: 'Analysis unavailable - please consult healthcare provider' };
      }

      // Update report with final results
      const finalStatus = extractionFailed ? 'failed' : 'completed';
      await storage.updateReport(reportId, {
        analysis,
        extractedData,
        summary: extractionFailed ? extractedText : summary,
        status: finalStatus,
      });

      // Create timeline entry only if processing succeeded
      if (!extractionFailed) {
        try {
          const report = await storage.getReport(reportId);
          if (report) {
            await storage.createHealthTimelineEntry({
              userId: report.userId,
              reportId: report.id,
              date: new Date(),
              eventType: reportType === 'prescription' ? 'medication_change' : 'lab_result',
              title: `${reportType.replace('_', ' ')} - ${report.fileName}`,
              description: summary,
              metrics: extractedData,
            });
          }
        } catch (timelineError) {
          console.error('Failed to create timeline entry:', timelineError);
          // Don't fail the whole process for timeline issues
        }
      }

      console.log(`Successfully completed processing for report ${reportId}`);
    } catch (error) {
      console.error('Report processing failed:', error);
      try {
        await storage.updateReport(reportId, {
          status: 'failed',
          summary: 'Processing failed due to technical error. Please try uploading again.',
        });
      } catch (updateError) {
        console.error('Failed to update report status:', updateError);
      }
    }
  }

  app.get('/api/reports', requireAuth, async (req, res) => {
    try {
      const reports = await storage.getUserReports(req.session.userId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.get('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report || report.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Medications routes
  app.get('/api/medications', requireAuth, async (req, res) => {
    try {
      const medications = await storage.getUserMedications(req.session.userId);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.get('/api/medications/active', requireAuth, async (req, res) => {
    try {
      const medications = await storage.getActiveMedications(req.session.userId);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.post('/api/medications', requireAuth, async (req, res) => {
    try {
      const medicationData = insertMedicationSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const medication = await storage.createMedication(medicationData);
      res.json(medication);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.patch('/api/medications/:id', requireAuth, async (req, res) => {
    try {
      const medication = await storage.getMedication(req.params.id);
      if (!medication || medication.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Medication not found' });
      }

      const updatedMedication = await storage.updateMedication(req.params.id, req.body);
      res.json(updatedMedication);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Reminders routes
  app.get('/api/reminders', requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getUserReminders(req.session.userId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.get('/api/reminders/active', requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getActiveReminders(req.session.userId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.post('/api/reminders', requireAuth, async (req, res) => {
    try {
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.patch('/api/reminders/:id', requireAuth, async (req, res) => {
    try {
      const reminder = await storage.getReminder(req.params.id);
      if (!reminder || reminder.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      const updatedReminder = await storage.updateReminder(req.params.id, req.body);
      res.json(updatedReminder);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Health timeline routes
  app.get('/api/timeline', requireAuth, async (req, res) => {
    try {
      const timeline = await storage.getUserHealthTimeline(req.session.userId);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const reports = await storage.getUserReports(req.session.userId);
      const activeMedications = await storage.getActiveMedications(req.session.userId);
      const activeReminders = await storage.getActiveReminders(req.session.userId);
      
      // Calculate health score (simplified)
      const completedReports = reports.filter(r => r.status === 'completed').length;
      const healthScore = Math.min(100, (completedReports * 10) + (activeMedications.length * 5) + 50);

      res.json({
        totalReports: reports.length,
        activeMedications: activeMedications.length,
        pendingReminders: activeReminders.length,
        healthScore: `${healthScore}%`,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Translation routes
  app.post('/api/translate', requireAuth, async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: 'Text and target language are required' });
      }

      const translatedText = await translateMedicalText(text, targetLanguage);
      res.json({ translatedText });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  // Sharing routes
  app.post('/api/share/create', requireAuth, async (req, res) => {
    try {
      const { reportIds, doctorEmail, expiresInDays = 7 } = req.body;
      
      const shareToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const sharedReport = await storage.createSharedReport({
        userId: req.session.userId,
        reportIds,
        shareToken,
        doctorEmail,
        expiresAt,
        isActive: true,
        viewCount: 0,
      });

      res.json({ 
        shareToken, 
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${shareToken}`,
        expiresAt 
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  app.get('/api/share/:token', async (req, res) => {
    try {
      const sharedReport = await storage.getSharedReport(req.params.token);
      if (!sharedReport || !sharedReport.isActive || new Date() > sharedReport.expiresAt) {
        return res.status(404).json({ message: 'Shared report not found or expired' });
      }

      // Increment view count
      await storage.updateSharedReport(sharedReport.id, {
        viewCount: sharedReport.viewCount + 1,
      });

      // Get the shared reports
      const reports = [];
      for (const reportId of sharedReport.reportIds) {
        const report = await storage.getReport(reportId);
        if (report) {
          reports.push(report);
        }
      }

      // Get user info
      const user = await storage.getUser(sharedReport.userId);
      const medications = await storage.getActiveMedications(sharedReport.userId);

      // Generate summary
      const healthSummary = await generateHealthSummary(reports, medications);

      res.json({
        patient: user ? `${user.firstName} ${user.lastName}` : 'Patient',
        reports,
        medications,
        healthSummary,
        sharedAt: sharedReport.createdAt,
        viewCount: sharedReport.viewCount + 1,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Operation failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
