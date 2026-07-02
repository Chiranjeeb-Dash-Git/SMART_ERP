
# 🚀 SMART_ERP

A modern, Tally-inspired cloud ERP system built with Next.js, React, and Neon PostgreSQL.

## 🌟 Features

- 🔐 **Authentication & Authorization (JWT-based)
- 🏢 **Company Management** (Limit of 5 companies per user)
- 📊 **Masters**:
  - Ledger Groups & Ledgers
  - Stock Groups & Stock Items
  - Units of Measurement
  - Customers & Suppliers
- 📝 **Vouchers**:
  - Sales Vouchers
  - Purchase Vouchers
  - And more!
- 📦 **Inventory Management** (Stock Summary, Inventory Transactions)
- 🧾 **Invoicing**
- 📈 **Reports**
- 📝 **Audit Logs**
- 🎨 **Cyberpunk-inspired Dark Theme**
- ⌨️ **Keyboard-first Interface**
- 📱 **Responsive Design**

## 🛠️ Tech Stack

### Frontend
- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Cyberpunk Theme**

### Backend
- **Node.js & Express**
- **Neon PostgreSQL** (Serverless)
- **JWT Authentication**
- **bcryptjs** for password hashing
- **PDFKit** for invoice generation
- **ExcelJS** for exports

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- A [Neon](https://neon.tech/) account (for PostgreSQL database)

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Chiranjeeb-Dash-Git/SMART_ERP.git
cd SMART_ERP
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

#### 3. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://your-neon-connection-string-here
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=30d
```
Replace `your-neon-connection-string-here` with your actual Neon PostgreSQL connection string.

#### 4. Initialize Database
The database schema is automatically managed. When you create your first company, all default master data (ledger groups, units, stock groups, ledgers) will be automatically created!

#### 5. Start Backend Server
```bash
# Development (with PostgreSQL):
npm run dev:db

# Production (with PostgreSQL):
npm run start:db

# Mock server (no database):
npm run dev
# or
npm run start
```

#### 6. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will now be running on http://localhost:3000

## 📁 Project Structure
```
SMART_ERP/
├── backend/           # Express.js backend
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── db/       # Database schema
│   │   ├── middleware/ # Auth middleware
│   │   ├── routes/   # API routes
│   │   ├── server.js # Real PostgreSQL server
│   │   └── server-mock.js # Mock server
│   └── package.json
├── frontend/          # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## 🛡️ Security Features

- **JWT-based authentication
- **Password hashing with bcryptjs
- **CORS enabled
- **Environment variables for secrets

## 📝 License

MIT

## 👨‍💻 Author

Chiranjeeb Dash

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
