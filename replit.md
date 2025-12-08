# Interex - AI-Powered Home Loan Optimization Platform

## Overview

Interex is a financial SaaS application designed to help Indian homeowners save lakhs on their home loans through AI-powered optimization. The platform provides automated interest rate monitoring, intelligent prepayment calculators, AI-driven bank negotiation letter generation, and comprehensive loan management features.

The application serves two primary user types:
- **Customers**: Homeowners managing their loans and optimizing payments
- **Admins**: Platform administrators managing user negotiations and system-wide operations

Core value proposition: Users can save ₹16+ lakhs in interest through strategic prepayments, rate negotiations, and data-driven optimization strategies.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 19, 2025)

### Completed Features

1. **Prepayment Calculator** (Fully Functional)
   - Backend API with precise EMI calculations and amortization schedule generation
   - Two strategies: Reduce EMI vs Reduce Tenure
   - Interactive frontend with charts (bar, pie, line) using Recharts
   - Accurate interest savings from actual amortization totals
   - Pagination for large amortization tables (24 months displayed)

2. **AI Financial Advisor** (Fully Functional)
   - 24/7 chatbot powered by OpenAI GPT-4o-mini
   - Context-aware responses using user's loan portfolio
   - Session-based conversation history
   - Personalized financial advice for Indian homeowners
   - Frontend chat interface at /chat
   - Auto-scroll, message threading, suggestion prompts
   - Quick action card on dashboard for easy access

3. **Smart Negotiation** (Fully Functional)
   - AI-powered professional bank letter generation using GPT-4o-mini
   - Context-aware letters citing market rates, payment history, and tenure
   - Customer workflow: Select loan, set target rate, get instant AI-generated letter
   - Admin review and approval system with notes
   - Status tracking: pending → approved/rejected
   - Letter download functionality (PDF-ready formatted text)
   - Quick action card on dashboard
   - Dedicated pages: /negotiations/new, /negotiations, /negotiations/:id
   - Admin dashboard: /admin/negotiations
   - Backend endpoints with role-based access control

4. **Intelligent Notifications** (Fully Functional)
   - Centralized notification service for all system events
   - 5 notification types with custom styling:
     - RBI repo rate changes (blue badge)
     - Bank-specific rate changes (purple badge)
     - Prepayment opportunities with savings estimates (green badge)
     - Milestone celebrations (25%, 50%, 75%, 100% loan repaid) (yellow badge)
     - EMI reminders (red badge)
   - Notification bell UI component with unread count badge
   - Dropdown panel showing recent notifications
   - Mark as read and mark all as read functionality
   - Integrated with negotiation approval workflow (sends notifications on approval/rejection)
   - Admin demo endpoint to generate test notifications for users with active loans
   - Backend endpoints: GET /notifications/, PATCH /notifications/:id/read, PATCH /notifications/mark-all-read
   - Frontend component visible in navbar across all protected pages
   - Uppercase enum values (REPO_RATE_CHANGE, etc.) enforced across backend and frontend

5. **Comprehensive Reports & Analytics** (Fully Functional)
   - Backend API with caching for monthly and annual savings reports
   - ReportService with AI narrative generation using GPT-4o-mini
   - Frontend Reports page with monthly/annual tabs and period selector
   - Lifetime summary dashboard with 4 key metrics cards
   - Recharts visualizations: bar chart for portfolio breakdown, pie chart for strategy distribution, line chart for timeline
   - AI-generated insights and recommendations
   - PDF export via print functionality
   - Social sharing with Web Share API and clipboard fallback
   - Quick action card on dashboard
   - Backend endpoints: GET /api/reports/generate, GET /api/reports/summary, GET /api/reports/
   - SavingsReport model with JSON report_data field for flexible data storage

6. **Rate Monitoring** (Fully Functional)
   - Real-time RBI repo rate tracking with historical data
   - Bank interest rate monitoring across 10+ major Indian banks
   - Rate comparison tool showing user's loan rate vs market rates
   - Potential savings calculator based on available better rates
   - Historical trend analysis with interactive charts
   - Three main tabs: Current Rates, My Loan Comparison, Historical Trends
   - Backend endpoints:
     - GET /api/rates/repo/current - Current RBI repo rate
     - GET /api/rates/repo/history - Historical repo rates
     - GET /api/rates/banks/current - Current bank rates
     - GET /api/rates/comparison - Compare user's rate with market
     - GET /api/rates/trends - Historical trends for visualization
   - Quick action card on dashboard for easy access
   - Integration with notification system for rate change alerts (REPO_RATE_CHANGE, BANK_RATE_CHANGE)
   - Seed script to populate initial rate data
   - Dedicated page at /rates with comprehensive market intelligence

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, built using Vite

**UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling

**Design System**: 
- Inspired by Stripe's clarity, Linear's typography, and Notion's dashboard density
- Typography: Inter (primary), Plus Jakarta Sans (display), JetBrains Mono (financial figures)
- Color scheme: Neutral base with professional blue primary (HSL-based with CSS variables)
- Responsive grid layouts with mobile-first approach
- Comprehensive spacing system using Tailwind utilities

**State Management**:
- TanStack Query (React Query) for server state and API caching
- Context API for authentication state (AuthContext)
- Local component state for UI interactions

**Routing**: Wouter for lightweight client-side routing

**Key Pages**:
- Landing page with marketing content
- Authentication (login/register)
- Dashboard with loan portfolio overview and quick action cards
- Individual loan detail views with amortization schedules
- Prepayment calculator with scenario modeling and detailed impact analysis
- **AI Financial Advisor** (/chat) - 24/7 chatbot with context-aware advice
- **Smart Negotiation** (/negotiations) - Request AI-generated bank letters for rate negotiation
  - /negotiations/new - Create new negotiation request
  - /negotiations/:id - View negotiation details and download letter
  - /admin/negotiations - Admin review dashboard (admin only)
- **Reports & Analytics** (/reports) - Monthly and annual savings reports with AI insights
- **Rate Monitoring** (/rates) - Track RBI repo rates and bank interest rates with comparison tools
- Admin panel for user management

### Backend Architecture

**Dual Backend Strategy**: The application uses a hybrid architecture with both Node.js and Python backends

**Node.js Backend** (Express):
- Serves as the primary application server
- Handles Vite development server integration
- Proxies API requests to Python FastAPI backend
- Manages static asset serving in production

**Python Backend** (FastAPI):
- Runs on port 8000 as a child process
- Handles all business logic and API endpoints
- Provides RESTful API endpoints under `/api/*` prefix
- Implements authentication with JWT tokens stored in HTTP-only cookies
- Session-based authentication (8-hour expiry)

**API Structure**:
- `/api/auth/*` - Authentication (register, login, logout, user info)
- `/api/loans/*` - Loan CRUD operations
- `/api/calculator/*` - Prepayment calculations and amortization
- `/api/negotiations/*` - Rate negotiation request management (CRUD, AI letter generation)
  - POST /api/negotiations/ - Create negotiation with AI letter
  - GET /api/negotiations/ - List user's negotiations
  - GET /api/negotiations/:id - Get negotiation details
  - GET /api/negotiations/admin/all - Admin: View all pending (admin only)
  - PATCH /api/negotiations/:id/approve - Admin: Approve request (admin only)
  - PATCH /api/negotiations/:id/reject - Admin: Reject request (admin only)
- `/api/notifications/*` - User notification system
  - GET /api/notifications/ - Get user's notifications (sorted by newest first)
  - PATCH /api/notifications/:id/read - Mark notification as read
  - PATCH /api/notifications/mark-all-read - Mark all notifications as read
- `/api/chat/*` - AI advisor chat interface
- `/api/rates/*` - Rate monitoring endpoints
  - GET /api/rates/repo/current - Current RBI repo rate
  - GET /api/rates/repo/history - Historical repo rates
  - GET /api/rates/banks/current - Current bank rates for home loans
  - GET /api/rates/comparison - Compare user's rate with market rates
  - GET /api/rates/trends - Rate trends for visualization
- `/api/reports/*` - Savings reports and analytics
  - GET /api/reports/generate - Generate monthly/annual report
  - GET /api/reports/summary - Lifetime savings summary
  - GET /api/reports/ - List user's reports
- `/api/admin/*` - Admin-only endpoints
  - POST /api/admin/notifications/demo - Generate demo notifications for testing (admin only)

**Authentication Flow**:
- Cookie-based JWT authentication (no refresh tokens)
- Password hashing with bcrypt via passlib
- Role-based access control (customer vs admin)
- 401 responses trigger client-side redirect to login

### Data Storage

**Database**: PostgreSQL with async support via asyncpg

**ORM**: SQLAlchemy 2.0 with async engine and sessions

**Schema Management**: 
- Alembic for Python backend migrations
- Drizzle ORM configured for Node.js (schema defined but not actively used)
- Database schema lives in `backend/app/models.py`

**Key Data Models**:
- **User**: Email-based authentication, role (customer/admin), subscription tier (free/premium), Stripe integration fields
- **Loan**: Bank details, amounts, interest rates, tenure, EMI calculations, amortization tracking
- **RepoRate**: RBI repo rate history (for market rate tracking)
- **BankRate**: Individual bank interest rates (scraped/monitored)
- **Prepayment**: Prepayment transaction history with strategy and savings calculations
- **NegotiationRequest**: User-initiated rate negotiation requests with AI-generated letters
- **Notification**: User notifications for rate changes, opportunities, milestones
- **ChatSession & ChatMessage**: AI advisor conversation persistence

**Enums**:
- UserRole: CUSTOMER, ADMIN (uppercase in database)
- SubscriptionTier: FREE, PREMIUM (uppercase in database)
- NegotiationStatus: DRAFT, PENDING, APPROVED, REJECTED, SENT (uppercase in database)
- NotificationType: REPO_RATE_CHANGE, BANK_RATE_CHANGE, PREPAYMENT_OPPORTUNITY, MILESTONE, NEGOTIATION_UPDATE, EMI_REMINDER (uppercase in database and API responses)
- PrepaymentStrategy: REDUCE_EMI, REDUCE_TENURE (uppercase in database)

### External Dependencies

**Payment Processing**:
- **Stripe**: Payment gateway for premium subscriptions
- Integration on both frontend (`@stripe/stripe-js`, `@stripe/react-stripe-js`) and backend (`stripe` Python SDK)
- Customer and subscription ID tracking in User model

**AI/LLM Services**:
- **OpenAI API** (GPT-4o-mini): Powers AI chat advisor and negotiation letter generation
- Context-aware responses using user loan data
- Fallback behavior when API key not configured

**Database Hosting**:
- **Neon Serverless PostgreSQL**: WebSocket-based connection pooling
- Connection string management via environment variables
- SSL mode handling for production deployments

**Background Jobs** (Configured but not actively implemented):
- **Celery**: Task queue framework
- **Redis**: Message broker and result backend
- **Flower**: Celery monitoring (development)
- Intended for rate scraping, notification sending, report generation

**Development Tools**:
- **Replit-specific plugins**: Runtime error overlay, cartographer, dev banner
- **Vite plugins**: React, custom middleware integration
- **TypeScript**: Full type safety across frontend and shared schemas

**Python Libraries**:
- **Web Scraping**: BeautifulSoup4, Selenium, requests, lxml (for bank rate monitoring)
- **Validation**: Pydantic for request/response schemas
- **Security**: python-jose for JWT, passlib for password hashing
- **Utilities**: python-dateutil, pytz for timezone handling

**Frontend Libraries**:
- **Charts**: Recharts for data visualization (amortization, prepayment impact)
- **Forms**: React Hook Form with Zod resolvers for validation
- **Utilities**: date-fns for date manipulation, clsx/tailwind-merge for className management

**Infrastructure**:
- WebSocket support via `ws` package for Neon database connections
- HTTP proxy middleware for Python backend integration
- Process management for concurrent Node/Python execution