# Smart ERP Project Documentation

## 1. Introduction

**Smart ERP** is a modern, cloud-based Enterprise Resource Planning (ERP) system heavily inspired by the keyboard-first functionality and robust accounting features of Tally. It is designed to handle accounting, inventory management, invoicing, and reporting through a sleek, fast, and responsive web interface. 

The application aims to provide a seamless user experience by combining a cyberpunk-inspired dark theme with a high-performance backend, making daily business operations both efficient and visually engaging. It supports multi-company management (up to 5 companies per user) and provides secure, role-based access to business data.

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
The client side is a Single Page Application (SPA) built with **Next.js** and **React**. It utilizes **TypeScript** for type safety, reducing runtime errors. The UI is styled completely using **Tailwind CSS**, providing a utility-first approach to craft the bespoke cyberpunk theme. **Framer Motion** is integrated to handle smooth animations and transitions, giving the application a modern feel. The UI components are built to be keyboard-accessible, mimicking traditional desktop accounting software.

### Backend Architecture
The server side is a RESTful API built on **Node.js** using the **Express.js** framework. It acts as the bridge between the frontend and the database. The API is secured using **JWT** for stateless authentication. Passwords and sensitive data are hashed using **bcryptjs**. The backend also handles resource-intensive tasks like generating PDFs (using **PDFKit**) and exporting Excel sheets (using **ExcelJS**).

### Database Architecture
Data is persisted in a **PostgreSQL** relational database, specifically hosted on **Neon**, which provides a scalable, serverless Postgres environment. The `pg` library is used in the Node.js backend to interface with the database. The database schema is designed to handle complex relationships between users, companies, ledgers, and transactions, ensuring ACID compliance for all financial data.

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

## 6. Dashboard Preview

![Smart ERP Dashboard Screenshot](./screenshot.png)

*(Note: Please ensure the `screenshot.png` file is placed in the root directory before pushing to GitHub)*

