🚍 TransitOps ERP
Enterprise Fleet Management & Transportation Operations Platform

Built for the Odoo Hackathon 2026

Transforming fleet operations through intelligent dispatching, compliance automation, operational analytics, and enterprise-grade user experiences.

<p align="center">










</p>
🚀 Overview

TransitOps ERP is an enterprise-grade Transportation Management System (TMS) designed to streamline fleet operations, driver management, trip dispatching, maintenance planning, fuel tracking, financial monitoring, and operational analytics.

Rather than functioning as a simple CRUD application, TransitOps focuses on decision-driven fleet operations, empowering organizations to monitor their transportation ecosystem through intelligent dashboards and role-based operational experiences.

The platform was developed during the Odoo Hackathon with a vision of delivering software that feels production-ready while demonstrating modern full-stack engineering practices.

🎯 Problem Statement

Transportation companies often struggle with:

Inefficient fleet utilization
Manual trip scheduling
Poor maintenance visibility
Driver compliance tracking
Fuel cost monitoring
Operational decision-making
Fragmented reporting

TransitOps centralizes these workflows into one integrated enterprise platform.

💡 Our Solution

TransitOps provides:

🚛 Fleet Management
👨‍✈️ Driver Management
🛣 Intelligent Trip Dispatching
🔧 Preventive Maintenance
⛽ Fuel Tracking
💰 Expense Management
📈 Operational Analytics
📊 Executive Dashboards
🔐 Role-Based Access Control
📄 Enterprise Reporting
👥 Role-Based Experience

Unlike traditional admin panels, every role has a dedicated operational workspace.

Role	Primary Responsibility
👑 Admin	Platform administration and system oversight
🚚 Fleet Manager	Fleet operations, dispatching and resource allocation
🛡 Safety Officer	Driver compliance and operational safety
📈 Financial Analyst	Cost monitoring, ROI and financial insights
🚛 Driver	Trip execution, fuel logging and assignment tracking

Each dashboard is specifically designed around the decisions that role needs to make.

✨ Key Features
🚛 Fleet Operations
Fleet Registry
Vehicle Availability
Vehicle Status Tracking
Fleet Utilization Monitoring
👨‍✈️ Driver Management
Driver Profiles
License Tracking
Driver Availability
Driver Assignment
🛣 Trip Management
Trip Creation
Smart Dispatch
Live Trip Status
Trip Completion Workflow
🔧 Maintenance
Maintenance Scheduling
Service History
Vehicle Downtime Tracking
Maintenance Queue
💰 Financial Management
Fuel Logs
Expense Tracking
Vehicle Cost Analysis
Operational Cost Reports
📊 Analytics
Fleet Utilization
Active Trips
Maintenance Insights
Fuel Trends
Operational KPIs
🖥 Enterprise Dashboard

TransitOps follows the philosophy:

One Screen = One Decision

Every dashboard answers a business question.

Fleet Manager → What requires my attention today?
Driver → What is my next assignment?
Safety Officer → Who is out of compliance?
Financial Analyst → Where are we spending money?
Admin → Is the system healthy?
🏗 Architecture
                React + TanStack Start
                        │
                TanStack Router
                        │
               React Query + API Layer
                        │
                  Express REST API
                        │
                     Prisma ORM
                        │
                   PostgreSQL
🛠 Technology Stack
Frontend
React 19
TanStack Start
TypeScript
Tailwind CSS
TanStack Router
TanStack Query
Radix UI
Recharts
Backend
Node.js
Express.js
Prisma ORM
PostgreSQL
JWT Authentication
bcrypt
Helmet
Morgan
📂 Project Structure
src/
 ├── components/
 ├── routes/
 ├── lib/
 ├── hooks/

server/
 ├── prisma/
 ├── src/
 ├── jobs/
 ├── middleware/
 ├── routes/
🚀 Quick Start
git clone https://github.com/renish7606/odoo-hackathon.git

cd odoo-hackathon

npm install

cd server
npm install

Configure:

DATABASE_URL=
JWT_SECRET=

Run backend

npm run dev

Run frontend

npm run dev
📸 Screenshots

Add screenshots here.

Login
Fleet Manager Dashboard
Driver Dashboard
Trip Management
Fleet Registry
Reports
Analytics
🎥 Demo

Add your hackathon demo video here.

Demo Link
🗺 Roadmap
Real-time GPS Tracking
Route Optimization
Push Notifications
Mobile Driver Application
AI Fleet Insights
Predictive Maintenance
👨‍💻 Team

Developed during the Odoo Hackathon.

Contributors:

Renish
Aadhya Dave
Team Members
⭐ Why TransitOps?

TransitOps isn't just another fleet management dashboard.

It combines modern enterprise UX, role-based workflows, business-driven dashboards, and full-stack architecture to deliver a transportation management platform focused on operational decision-making rather than simple data management.
