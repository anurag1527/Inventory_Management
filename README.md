# Inventory & Order Management System

A production-ready Full Stack Inventory and Order Management System built with **React (Vite)**, **FastAPI**, and **PostgreSQL**. Features role-based access control (RBAC), stock movement audit trails, dynamic analytics dashboards, and complete CRUD operations.

## 🚀 Live Demo

- **Frontend (Vercel):** https://inventory-management-x5ta-3399wlquk-anurag1527s-projects.vercel.app/login 
- **Backend API (Render):**  https://inventory-management-backend-latest-68fk.onrender.com

## 🔐 Admin Credentials

To access the system, use the following credentials:
- **Email:** `anurag@gmail.com`
- **Password:** `12345`

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js + Vite
- **Routing:** React Router DOM
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** Custom CSS (Dark Theme/Glassmorphism)

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT (JSON Web Tokens) with Passlib & Bcrypt

### DevOps
- **Orchestration:** Docker & Docker Compose
- **Containerization:** Multi-stage Dockerfiles for both Frontend (Nginx) and Backend (Python)

---

## 💻 Local Development

You can run the entire application locally using Docker.

1. Clone the repository:
```bash
git clone https://github.com/anurag1527/Inventory_Management.git
cd Inventory_Management
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the Application:
- Frontend UI: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

## 🚢 Deployment Guide

This project is configured to be deployed easily on **Vercel** (Frontend) and **Render** (Backend Database & API).

### 1. Deploying the Backend on Render
- Connect your GitHub repository to Render.
- Create a new **PostgreSQL** database on Render.
- Create a new **Web Service** on Render and select the `backend` directory (or use the Docker environment).
- **Environment Variables:**
  - `DATABASE_URL`: Set this to your Render PostgreSQL Internal/External URL.
  - `SECRET_KEY`: Generate a random secure string for JWT.

### 2. Deploying the Frontend on Vercel
- Connect your GitHub repository to Vercel.
- Select the `frontend` folder as the Root Directory.
- Framework Preset: **Vite**
- **Environment Variables:**
  - `VITE_API_URL`: Set this to your Render Backend URL (e.g., `https://your-api.onrender.com`).

---

## 📝 Features
- **Role-Based Access:** Admin (full control) and Manager (limited control).
- **Stock Movements:** Every stock addition, order, or manual adjustment is logged in the audit trail.
- **Dynamic Analytics:** Real-time revenue tracking, top products, and low stock alerts.
- **Order Management:** Place orders that automatically decrement inventory and log the sale.
