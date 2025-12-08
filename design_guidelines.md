# Interex Design Guidelines

## Design Approach: Modern Financial SaaS

**Reference Inspiration**: Stripe's clarity + Linear's typography + Notion's dashboard density

**Design Philosophy**: Professional, trustworthy, data-first financial tool that makes complex loan calculations feel approachable and actionable.

---

## Typography System

**Font Stack**: 
- Primary: Inter (Google Fonts) - All UI text, numbers, labels
- Display: Plus Jakarta Sans (Google Fonts) - Hero headings, section titles
- Monospace: JetBrains Mono - Financial figures, EMI amounts, interest rates

**Hierarchy**:
- Hero Display: text-6xl (72px), font-bold, tracking-tight
- Page Headers: text-4xl (36px), font-bold
- Section Titles: text-2xl (24px), font-semibold
- Card Headers: text-xl (20px), font-semibold
- Body Text: text-base (16px), font-normal
- Financial Figures: text-3xl (30px), font-mono, font-bold
- Small Data: text-sm (14px), tabular-nums
- Captions: text-xs (12px), uppercase, tracking-wide

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6 or p-8
- Section spacing: py-12 or py-16 (mobile), py-20 or py-24 (desktop)
- Card gaps: gap-6
- Form field spacing: space-y-4

**Grid System**:
- Dashboard: 3-column grid (lg:grid-cols-3) for stat cards
- Calculator sections: 2-column split (lg:grid-cols-2) - inputs left, results right
- Loan cards: 1-2-3 responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Amortization table: Full-width with horizontal scroll on mobile

**Container Strategy**:
- Marketing pages: max-w-7xl mx-auto px-4
- Dashboard content: max-w-6xl mx-auto px-6
- Forms and calculators: max-w-4xl mx-auto
- Chat interface: max-w-3xl mx-auto

---

## Component Library

### Navigation
- **Header**: Sticky top navigation with logo left, nav links center, user menu + CTA right
- **Sidebar** (Dashboard): Fixed left sidebar (w-64) with loan selector, main nav, settings at bottom
- **Mobile**: Hamburger menu with slide-out drawer

### Cards & Containers
- **Stat Cards**: Rounded-xl, shadow-sm, p-6, with icon, large number (text-3xl), label, and trend indicator
- **Loan Cards**: Rounded-lg, border, p-6, with bank logo, loan amount, EMI, next due date, progress bar
- **Info Panels**: Rounded-lg, subtle border, p-8, for calculator results and comparisons
- **Alert Banners**: Rounded-lg, p-4, with icon left, message, action button right

### Forms & Inputs
- **Text Inputs**: h-12, rounded-lg, border, px-4, with floating labels
- **Amount Inputs**: Prefix with ₹ symbol, text-right, font-mono
- **Sliders**: Custom styled with rupee value display above thumb
- **Dropdowns**: Select banks/strategies with search functionality
- **Date Pickers**: Calendar modal for EMI dates
- **Toggle Switches**: For EMI vs Tenure strategy selection

### Data Display
- **Tables**: Stripe-style with subtle row hover, sticky header, right-aligned numbers
- **Charts**: Using Recharts - line charts for trends, bar charts for comparisons, donut for interest breakdown
- **Progress Bars**: Rounded-full, showing loan completion percentage
- **Badges**: Rounded-full, text-xs, uppercase for loan status (Active/Closed), plan tier (Free/Premium)

### Interactive Elements
- **Primary CTA**: Large (h-12 or h-14), rounded-lg, font-semibold
- **Secondary**: Outlined variant with border
- **Icon Buttons**: Circular, p-3, for actions like edit/delete
- **Tabs**: Underline style for calculator strategies and report views

### AI Advisor Chat
- **Chat Container**: Fixed bottom-right bubble launcher, expands to modal (max-w-lg)
- **Message Bubbles**: User messages right-aligned, AI responses left with avatar
- **Input**: Sticky bottom, rounded-full, with send button

---

## Page-Specific Layouts

### Landing Page (Marketing)
1. **Hero Section** (h-screen): Large hero image (Indian family in modern home), centered headline "Save ₹16+ Lakhs on Your Home Loan", subheading, dual CTAs (Start Free / Watch Demo), floating trust indicators
2. **Problem Showcase** (py-24): 3-column grid showing pain points with icons
3. **Solution Features** (py-24): Alternating 2-column layouts with feature screenshots and descriptions
4. **Calculator Demo** (py-24): Embedded interactive calculator with real example
5. **Social Proof** (py-20): Customer testimonials in 3-column grid with savings achieved
6. **Pricing** (py-24): Side-by-side comparison table (Free vs Premium ₹299/mo)
7. **CTA Section** (py-20): Centered large CTA with urgency messaging
8. **Footer**: 4-column grid - Product, Resources, Company, Legal, with newsletter signup

### Customer Dashboard
**Layout**: Sidebar + main content area
- **Header**: Welcome message, date, notification bell
- **Quick Stats Row**: 4 stat cards - Total Loans, Savings This Year, Next EMI, Active Alerts
- **Loan Cards Grid**: 3-column grid of user's loans with quick actions
- **Recent Activity Timeline**: Chronological feed of notifications and milestones
- **AI Advisor Widget**: Persistent bottom-right chat bubble

### Loan Detail Page
- **Hero Section**: Bank logo, loan summary (amount, rate, EMI, remaining), visual progress bar
- **Action Bar**: Quick buttons - Make Prepayment, Request Rate Negotiation, Download Statement
- **Tabs**: Overview | Amortization Schedule | Payment History | Documents
- **Amortization Table**: Month | EMI | Principal | Interest | Outstanding - with search and filters

### Prepayment Calculator
**2-Column Layout**:
- **Left Panel**: Form inputs (loan details pre-filled, prepayment amount slider, strategy toggle)
- **Right Panel**: Live results - before/after comparison cards, savings highlight (large text), charts
- **Bottom**: Full-width "Proceed with Prepayment" CTA

### Admin Dashboard
- **Top Stats Bar**: Total Users, Premium Subscribers, Pending Negotiations, System Status
- **Main Grid**: 
  - Pending Negotiations Queue (2/3 width)
  - Recent Repo Rate Changes (1/3 width)
- **Management Sections**: Tabs for Users, Banks, Analytics

---

## Images

**Hero Image**: Professional photograph of an Indian family (parents and child) in a modern, well-lit home interior showing happiness and security. Warm, aspirational tone. Place as full-width background with subtle overlay for text readability.

**Feature Screenshots**: High-quality mockups of the calculator interface, dashboard, and chat advisor showing real data and calculations.

**Bank Logos**: Small, grayscale bank logos throughout for visual recognition (HDFC, SBI, ICICI, etc.)

**Testimonial Photos**: Circular headshots of customers (Indian professionals, age 30-45) in testimonial section.

---

## Indian Market Considerations

- **Currency Formatting**: Always use ₹ prefix, Indian numbering (₹16,00,000 not ₹1,600,000)
- **Bank Recognition**: Prominent display of familiar Indian bank logos
- **Language**: Mix of English with Hindi terms where natural ("lakhs" not "hundred thousand")
- **Trust Signals**: Display "RBI-tracked rates" badges, security certifications

---

## Interaction Patterns

- **Hover States**: Subtle lift (translate-y-1) and shadow increase on cards
- **Loading States**: Skeleton screens for data-heavy components
- **Empty States**: Friendly illustrations with clear CTAs ("Add your first loan")
- **Success Confirmations**: Toast notifications (top-right) for actions completed
- **Form Validation**: Inline error messages below fields with icon indicators