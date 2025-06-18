# PropNet - Real Estate Marketplace Platform

## Overview

PropNet is a comprehensive real estate marketplace platform built with React frontend and Express.js backend. The platform enables real estate agents to list properties, manage client requirements, collaborate through co-listing features, and communicate via an integrated messaging system. The application includes advanced features like AI-powered property extraction, analytics tracking, bulk property uploads, and interactive map visualization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Phone-based OTP authentication via Twilio
- **File Handling**: Multer for file uploads with size restrictions
- **API Structure**: RESTful endpoints with comprehensive error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Caching**: In-memory cache with TTL for performance optimization
- **File Storage**: Local file system for property images and documents
- **Session Store**: PostgreSQL-backed session storage

## Key Components

### Authentication System
- Phone number-based registration and login
- OTP verification using Twilio SMS service
- KYC completion flow for user onboarding
- Session-based authentication with secure cookies
- Rate limiting for OTP requests to prevent abuse

### Property Management
- **CRUD Operations**: Full property lifecycle management
- **Bulk Upload**: CSV import functionality for multiple properties
- **AI Integration**: Google Gemini AI for property data extraction from text
- **Image Handling**: Multiple photo uploads with file validation
- **Listing Types**: Support for exclusive, co-listing, and shared listings
- **Owner Consent**: Approval workflow for property listings

### Co-listing System
- Request-based collaboration between agents
- Status tracking (pending, approved, rejected)
- Revenue sharing capabilities
- Notification system for co-listing activities

### Messaging Platform
- Real-time conversations between users
- Property-specific discussions
- Contact request management
- Unread message tracking
- Message history and search functionality

### Analytics & Tracking
- User session tracking with device information
- Event tracking for user interactions
- Onboarding progress monitoring
- Property performance metrics
- Engagement analytics and retention tracking

### Search & Discovery
- Advanced property filtering and search
- Interactive map view with Google Maps integration
- Property recommendations based on requirements
- Location-based search with geocoding

## Data Flow

### User Registration Flow
1. Phone number input and validation
2. OTP generation and SMS delivery via Twilio
3. OTP verification and user creation
4. KYC completion with profile information
5. Dashboard access and onboarding tracking

### Property Listing Flow
1. Property data input (manual or AI-assisted)
2. Photo and document uploads
3. Owner consent collection (if required)
4. Listing approval and publication
5. Search index updates and cache invalidation

### Co-listing Request Flow
1. Agent discovers property and requests co-listing
2. Property owner receives notification
3. Owner approves/rejects request
4. Co-listing relationship established
5. Revenue sharing terms activation

### Messaging Flow
1. User initiates conversation about property
2. Real-time message delivery
3. Notification system activation
4. Message history persistence
5. Unread status tracking

## External Dependencies

### API Integrations
- **Google Gemini AI**: Property data extraction and enhancement
- **Google Maps API**: Location services and map visualization
- **Twilio SMS**: OTP delivery and phone verification
- **SendGrid**: Email notifications (production ready)

### Third-party Services
- **Stripe**: Payment processing integration (configured)
- **Neon Database**: PostgreSQL hosting with serverless capabilities
- **File Upload Services**: Multer with configurable storage limits

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS**: CSS processing with Tailwind CSS
- **TypeScript**: Type safety across frontend and backend

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Environment variable validation and security headers
- **Staging**: Beta environment with production-like configuration

### Security Implementation
- Rate limiting (1000 requests per 15 minutes for beta)
- Input sanitization and XSS protection
- SQL injection prevention with parameterized queries
- Secure session management with HTTPS enforcement
- File upload validation and size restrictions
- CORS configuration for production domains

### Performance Optimization
- Database query caching with 5-minute TTL
- Connection pooling for database efficiency
- Image optimization and lazy loading
- Bundle optimization for reduced payload size
- Service worker implementation for offline functionality

### Production Readiness
- Comprehensive error handling and logging
- Health check endpoints for monitoring
- Database backup and recovery procedures
- SSL/TLS encryption enforcement
- Environment-specific configuration management

## Changelog
- June 15, 2025. Initial setup
- June 18, 2025. Implemented broker-focused landing page for beta testing phase

## Recent Changes

### Landing Page Implementation (June 18, 2025)
- Created comprehensive prelaunch landing page targeting real estate brokers
- Focused on broker pain points: lead protection, commission loss, listing chaos
- Added detailed beta application form collecting broker information
- Implemented "Built for brokers, by brokers" messaging strategy
- Updated routing to make landing page default (/) with login moved to /login
- Added backend API endpoint for beta signup form processing
- Designed for limited user onboarding (250 verified brokers target)

### Key Features Added
- Problem-solution framework highlighting broker challenges
- Feature showcase with commission protection and anti-poaching tools
- Comprehensive beta application form with business context questions
- Professional testimonials and roadmap sections
- Mobile-responsive design with broker-specific messaging

## User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Broker pain points and testing phase user acquisition.
Landing page objective: Get interested broker data and onboard limited beta testers.