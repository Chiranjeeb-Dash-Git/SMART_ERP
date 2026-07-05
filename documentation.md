# Smart ERP Project Documentation

![Smart ERP Dashboard Screenshot](./Screenshot%202026-07-05%20093631_.png)

## 1. Introduction

**Smart ERP** is a modern, cloud-based Enterprise Resource Planning (ERP) system heavily inspired by the keyboard-first functionality and robust accounting features of Tally. It is designed to handle comprehensive business operations with an intuitive, keyboard-first interface.

The application aims to provide a seamless user experience by combining a cyberpunk-inspired dark theme with a high-performance backend, making daily business operations both efficient and visually engaging. The dashboard showcases real-time metrics including total vouchers, sales figures, stock valuation, and active ledger accounts with quick-action buttons for rapid data entry.

---

## 2. Features and Capabilities

The Smart ERP system encompasses a wide range of modules essential for business management:

- **Authentication & Security:** Secure user login and registration using JWT (JSON Web Tokens) with hashed passwords.
- **Multi-Company Management:** Users can create and manage multiple companies under a single account.
- **Master Data Management:** 
  - **Accounting Masters:** Ledger Groups and Ledgers.
  - **Inventory Masters:** Stock Groups, Stock Items, and Units of Measurement (UOM).
  - **Party Masters:** Customers and Suppliers management.
- **Voucher Entry System:** 
  - Comprehensive data entry for Sales, Purchases, Receipts, and Payments.
- **Inventory Management:** 
  - Real-time Stock Summary and Inventory Transaction tracking.
- **Invoicing:** Generate professional invoices in PDF format.
- **Reporting & Data Export:** Generate reports and export data to Excel using ExcelJS.
- **Audit Trails:** Detailed audit logs to track changes and ensure data integrity.
- **UI/UX:** Keyboard-first interface for rapid data entry, responsive design for all devices, and a cyberpunk dark theme.

---

## 3. How It Was Made (System Architecture)

The project follows a standard decoupled **Client-Server Architecture**:

### Frontend Architecture
The client side is a Single Page Application (SPA) built with **Next.js** and **React**. It utilizes **TypeScript** for type safety, reducing runtime errors. The UI is styled completely using **Tailwind CSS**, providing a responsive and cyberpunk-inspired dark theme with smooth animations powered by Framer Motion.

### Backend Architecture
The server side is a RESTful API built on **Node.js** using the **Express.js** framework. It acts as the bridge between the frontend and the database. The API is secured using **JWT** for stateless authentication and implements comprehensive business logic for accounting and inventory management.

### Database Architecture
Data is persisted in a **PostgreSQL** relational database, specifically hosted on **Neon**, which provides a scalable, serverless Postgres environment. The `pg` library is used in the Node.js backend for database connectivity and query execution.

---

## 4. Tools and Technologies Used

### Frontend Stack
- **Framework:** Next.js (v16.2)
- **Library:** React (v19.2)
- **Language:** TypeScript (v5)
- **Styling:** Tailwind CSS (v4)
- **Animations:** Framer Motion (v12.4)
- **Icons:** Lucide React
- **Linting:** ESLint

### Backend Stack
- **Runtime:** Node.js
- **Framework:** Express.js (v4.21)
- **Language:** JavaScript (CommonJS/ES Modules)
- **Authentication:** JSON Web Tokens (jsonwebtoken), bcryptjs
- **Database Driver:** pg (node-postgres)
- **Document Generation:** PDFKit (for PDF invoices), ExcelJS (for spreadsheet exports)
- **Other Utilities:** CORS, dotenv, uuid, nodemon (for development)

### Database
- **Database Engine:** PostgreSQL
- **Hosting Provider:** Neon (Serverless Postgres)

---

## 5. Project Structure

```text
SMART_ERP/
├── backend/                  # Node.js & Express API
│   ├── src/
│   │   ├── config/           # Database & environment configurations
│   │   ├── db/               # Database initialization and schemas
│   │   ├── middleware/       # Express middlewares (e.g., Auth verification)
│   │   ├── routes/           # API endpoints (users, companies, ledgers, etc.)
│   │   ├── server.js         # Main entry point (PostgreSQL connection)
│   │   └── server-mock.js    # Mock server for testing without a DB
│   ├── .env                  # Environment variables
│   └── package.json          # Backend dependencies
├── frontend/                 # Next.js Application
│   ├── app/                  # Next.js App Router (pages & layouts)
│   ├── components/           # Reusable React components (Sidebar, UI elements)
│   ├── lib/                  # Frontend utilities and API clients
│   └── package.json          # Frontend dependencies
└── README.md                 # Brief project overview
```

---

## 6. Dashboard Overview

The Smart ERP Dashboard provides a comprehensive overview of key business metrics and operations:

### Company Information Panel
- **Address:** Display of company location details
- **Tax Information:** GST and PAN details for compliance
- **Contact:** Contact information for the company
- **Financial Year:** Current financial year span

### Key Metrics Cards
- **Total Vouchers:** Count of all voucher entries with active status indicator
- **Total Sales:** Aggregated sales revenue in INR currency
- **Stock Value:** Total inventory valuation
- **Active Ledgers:** Count of active ledger accounts for accounting reference

### Quick Actions
- **Create Ledger:** Rapid ledger creation for new accounts
- **Add Item:** Quick inventory item addition
- **Create Voucher:** Fast voucher entry for transactions
- **Record Sale/Purchase:** Quick transaction recording
- **Generate Invoice:** On-demand invoice generation
- **View Reports:** Access to business reports and analytics

### Navigation Sidebar
- **Masters Section:** Access to Ledgers, Customers, Suppliers, Inventory, Stock Groups, and Units
- **Transactions Section:** Vouchers and Invoices management
- **Company Switcher:** Easy switching between multiple companies
- **User Profile:** Account settings and preferences

---

## 7. Live Deployments & Getting Started

### 🟢 Live Demo
You can access the fully functional production build of Smart ERP here:
- **Frontend (Vercel):** [https://smart-naff5gjfr-chiranjeeb-dash-gits-projects.vercel.app/](https://smart-naff5gjfr-chiranjeeb-dash-gits-projects.vercel.app/) (or main domain: [https://smart-erp-phi.vercel.app/](https://smart-erp-phi.vercel.app/))
- **Backend API (Render):** [https://smart-erp-402y.onrender.com](https://smart-erp-402y.onrender.com)
- **Database:** Serverless PostgreSQL via Neon

### Local Development Prerequisites
- Node.js (v20 or higher)
- PostgreSQL database (or Neon account)
- npm or yarn package manager

### Local Installation

**1. Backend Setup:**
```bash
cd backend
npm install
# Create a .env file and add your Neon DATABASE_URL and JWT_SECRET
npm run dev:db
```

**2. Frontend Setup:**
```bash
cd frontend
npm install
# Create a .env.local file if needed (e.g., NEXT_PUBLIC_API_URL=http://localhost:5001/api)
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 8. Key Highlights

✨ **Keyboard-First Design** - Optimized for rapid data entry with keyboard shortcuts
🎨 **Cyberpunk Theme** - Modern dark theme with teal accents for reduced eye strain
📊 **Real-Time Metrics** - Live dashboard with key business indicators
🔐 **Enterprise Security** - JWT authentication with encrypted passwords
💼 **Multi-Company Support** - Manage multiple business entities seamlessly
📈 **Comprehensive Reporting** - Generate reports and export to Excel/PDF
🗄️ **Scalable Architecture** - Serverless PostgreSQL with cloud-ready backend
