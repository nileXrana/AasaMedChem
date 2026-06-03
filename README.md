# AASA

A high-precision B2B Inventory & Order Management System designed for enterprise-grade supply chains.

## Key Features

- **High-Precision Calculations**: Full support for weights, volumes, and custom counts with mathematical precision up to 6 decimal places (powered by `decimal.js`).
- **Role-Based Access Control**: Secure JWT-based authentication supporting **Admin** and **Seller** portals with a 7-day session session lifetime.
- **Admin Dashboard**: Comprehensive product catalog management and system-wide order auditing showing both display and base-unit representation.
- **Seller Dashboard**: Quick order placement with instant debounced search and live invoice/cart calculations.
- **Database Architecture**: Powered by Prisma v7 and Neon PostgreSQL, using integer-based scaling (e.g., storing milligrams, milliliters) to prevent floating-point rounding errors.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (v5)
- **Styling**: Tailwind CSS & Shadcn UI

## Setup & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file based on `.env.example`:
   ```env
   DATABASE_URL="your-postgresql-url"
   AUTH_SECRET="your-nextauth-secret"
   ```

3. **Database Setup**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Production Build

To build and run the application for production:
```bash
npm run build
npm start
```
