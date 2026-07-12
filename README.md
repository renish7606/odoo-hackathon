# 🚌 TransitOps

A modern, full-stack fleet and transportation management platform designed to streamline transit operations, maintenance tracking, driver management, and financial analytics. 



## ✨ Features

- **Role-Based Access Control (RBAC):** Tailored experiences and secure access for:
  - 👑 **Fleet Manager:** Full access to all operations, dispatching, and global analytics.
  - 📡 **Dispatcher:** Focused on active trips, route management, and vehicle assignments.
  - 🛡️ **Safety Officer:** Manages driver compliance, safety scores, and license expiries.
  - 📈 **Financial Analyst:** Tracks fuel logs, operational expenses, and ROI analytics.
- **Live Operations Dashboard:** Real-time metrics on fleet utilization, active trips, available vehicles, and operational costs.
- **Fleet & Maintenance Management:** Register new vehicles, track odometers, and log shop maintenance tickets.
- **Driver Management:** Monitor driver availability, contact info, and compliance.
- **Trip Dispatching:** Create, manage, and complete cargo or passenger transit trips.
- **Financial Reporting:** Dedicated expense logging and fuel tracking.

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** TanStack Router (File-based, type-safe routing)
- **Styling:** Tailwind CSS & shadcn/ui
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### **Backend**
- **Runtime:** Node.js
- **API Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens) & bcrypt

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database

### 1. Clone & Install
```bash
git clone https://github.com/renish7606/odoo-hackathon.git
cd odoo-hackathon

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Environment Setup
Create a `.env` file in the `server` directory and configure your database and JWT secret:
```env
# server/.env
DATABASE_URL="postgresql://user:password@localhost:5432/transitops"
PORT=5000
JWT_SECRET="your_super_secret_key"
JWT_EXPIRES_IN="24h"
```

### 3. Database Migration & Seeding
Set up your PostgreSQL database schema and seed it with initial mock data:
```bash
cd server
npx prisma db push
node prisma/seed.js
```

### 4. Run the Application
You will need two terminal windows to run both the frontend and backend servers.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
# From the project root
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🔐 Demo Accounts
You can log in to test the RBAC functionality using the following pre-seeded mock accounts (Password for all accounts: `devarsh1211`):

- **Fleet Manager:** `john.fleet@transitops.com`
- **Dispatcher:** `sarah.driver@transitops.com`
- **Safety Officer:** `lisa.safety@transitops.com`
- **Financial Analyst:** `david.finance@transitops.com`

## 📁 Project Structure

```text
odoo-hackathon/
├── server/                 # Node.js + Express Backend
│   ├── prisma/             # Database schema and seed scripts
│   ├── src/
│   │   ├── controllers/    # API business logic
│   │   ├── middleware/     # Auth and validation guards
│   │   ├── routes/         # Express API routes
│   │   └── index.js        # Server entry point
├── src/                    # React Frontend
│   ├── components/         # Reusable UI components (shadcn)
│   ├── lib/                # Utilities, Permissions, and Global Store
│   ├── routes/             # TanStack Router page components
│   └── main.tsx            # Frontend entry point
└── package.json
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/renish7606/odoo-hackathon/issues).

---
*Built for the Odoo Hackathon* 🚀
