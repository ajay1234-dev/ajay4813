# Medical Report Interpretation Platform

## Overview

This is a comprehensive medical report interpretation platform that transforms complex medical documents into patient-friendly explanations. The system allows patients to upload medical reports (PDFs, images) and receive AI-powered analysis with plain language summaries, medication management, and health tracking features. The platform is designed to be accessible, user-friendly, and help reduce repeated doctor visits by providing clear health information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Voice Features**: Web Speech API integration for text-to-speech functionality to make reports accessible

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Session Management**: Express sessions for user authentication
- **File Processing**: Multer for file upload handling with support for PDF, JPG, PNG formats
- **OCR Processing**: Tesseract.js for optical character recognition of medical documents

### Database Design
The system uses PostgreSQL with the following key tables:
- **Users**: Store user profiles with authentication data, preferences, and support for multiple auth providers (email/password, Google)
- **Reports**: Medical documents with OCR text, AI analysis, and processing status
- **Medications**: Prescription tracking with dosage, frequency, and active status
- **Reminders**: Medication and appointment reminders with scheduling
- **Health Timeline**: Historical health data for trend analysis
- **Shared Reports**: Secure sharing mechanism for healthcare providers

### Authentication & Security
- **Dual Authentication Methods**: Support for both email/password and Firebase/Google authentication
- **Firebase Integration**: Google Sign-In with secure server-side ID token verification
- **Session-based Authentication**: Server-side sessions with bcrypt password hashing for email/password users
- **Token Verification**: JWT-based Firebase ID token verification with Google public key validation
- **File Upload Security**: Type validation and size limits for uploaded documents
- **Database Security**: Prepared statements through Drizzle ORM prevent SQL injection

### AI Integration
- **Gemini Integration**: Google's Gemini 2.5 models for medical report analysis and plain language generation
- **Medical Analysis Pipeline**: Structured extraction of key medical parameters with normal/abnormal status detection
- **Translation Services**: Multi-language support for medical explanations

### External Services Integration
- **Supabase Ready**: Infrastructure prepared for Supabase integration (currently using direct database connection)
- **OCR Services**: Tesseract for text extraction with fallback to cloud OCR services
- **Voice Services**: Browser-native speech synthesis for accessibility

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless database
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Authentication**: bcrypt for password hashing, express-session for session management

### AI & Processing Services
- **Google Gemini API**: Gemini 2.5 models for medical report analysis and natural language generation
- **Tesseract.js**: Client and server-side OCR for document text extraction
- **PDF Processing**: pdf-parse for PDF text extraction

### Frontend Libraries
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Data Fetching**: TanStack React Query for server state management
- **Charting**: Recharts for health trend visualization
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Development Tools
- **Build System**: Vite with TypeScript support and React plugin
- **Code Quality**: TypeScript for type safety across the full stack
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Cloud Services (Configured)
- **Firebase Authentication**: Google Sign-In integration with server-side token verification
- **Supabase**: Prepared for additional authentication and storage services
- **File Storage**: Ready for cloud storage integration for uploaded documents
- **Deployment**: Configured for production deployment with environment-based configuration

## Recent Changes (October 2025)

### Firebase Google Authentication
- **Added Google Sign-In**: Patients can now sign in using their Google accounts for easier access
- **Secure Token Verification**: Server-side Firebase ID token verification using JWT and Google public keys
- **Dual Auth Support**: Users can choose between traditional email/password or Google sign-in
- **Database Schema Updates**: Added support for multiple authentication providers with optional password field
- **Security Features**: 
  - RSA signature verification with Google's public keys
  - Audience and issuer claim validation
  - Token expiration checks
  - Sanitized error messages to prevent information leakage