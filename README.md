# EduRegister — Student Registration System

A full-stack **Student Registration & Fee Management System** built with:

- **Backend:** Django 4.2 + Django REST Framework + MySQL
- **Frontend:** React 18 + Tailwind CSS + React Query
- **Architecture:** MVC (Model-View-Controller), separated frontend/backend
- **Auth:** JWT (access + refresh tokens with auto-rotation)

---

## 📁 Project Structure

```
student-registration-system/
│
├── backend/                        ← Django (MVC Backend)
│   ├── config/
│   │   ├── settings.py             ← Django settings
│   │   ├── urls.py                 ← Root URL dispatcher
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/               ← User auth & roles (student/teacher/registrar)
│   │   │   ├── models.py           ← M: Custom User model
│   │   │   ├── serializers.py      ← V: Data transformation
│   │   │   ├── views.py            ← C: Request handling
│   │   │   ├── urls.py             ← URL routing
│   │   │   ├── permissions.py      ← Role-based access
│   │   │   └── management/commands/seed_demo_data.py
│   │   ├── students/               ← Student enrollment & programs
│   │   │   ├── models.py           ← M: Student, Program, AcademicYear
│   │   │   ├── serializers.py      ← V
│   │   │   ├── views.py            ← C
│   │   │   └── urls.py
│   │   ├── fees/                   ← Fee tracking + 60% auto-registration
│   │   │   ├── models.py           ← M: FeeRecord, Payment (cash/card)
│   │   │   ├── serializers.py      ← V
│   │   │   ├── views.py            ← C
│   │   │   └── urls.py
│   │   └── courses/                ← Course & enrollment management
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── views.py
│   │       └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── setup.sql
│
└── frontend/                       ← React (MVC Frontend — View layer)
    ├── src/
    │   ├── contexts/
    │   │   └── AuthContext.jsx     ← Global auth state (C)
    │   ├── services/
    │   │   └── api.js              ← Axios + all API service calls
    │   ├── utils/
    │   │   └── helpers.js          ← Formatters, class helpers
    │   ├── components/
    │   │   └── layout/
    │   │       ├── Layout.jsx      ← Sidebar + main shell
    │   │       └── UI.jsx          ← Reusable UI primitives
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx   ← Stats, charts, recent payments
    │   │   ├── StudentsPage.jsx    ← List, search, add student
    │   │   ├── StudentDetailPage.jsx ← Profile + fees + payment modal
    │   │   ├── FeesPage.jsx        ← Fee records management
    │   │   ├── PaymentsPage.jsx    ← Transaction history
    │   │   ├── CoursesPage.jsx     ← Course cards + add course
    │   │   └── UsersPage.jsx       ← User management (registrar only)
    │   ├── App.jsx                 ← Router + protected routes
    │   ├── main.jsx                ← React entry point
    │   └── index.css               ← Tailwind + design tokens
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🚀 Setup Instructions

### Prerequisites

| Tool      | Version  |
|-----------|----------|
| Python    | 3.10+    |
| Node.js   | 18+      |
| MySQL     | 8.0+     |
| npm / yarn| latest   |

---

### 1. MySQL Database

```bash
# Log into MySQL as root
mysql -u root -p

# Run the setup script
source backend/setup.sql;
# OR manually:
CREATE DATABASE student_registration_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 2. Backend (Django)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your database credentials in config/settings.py
# Update DATABASES > NAME, USER, PASSWORD

# Run migrations (creates all tables)
python manage.py makemigrations accounts students fees courses
python manage.py migrate

# Create a Django superuser (optional, for /admin)
python manage.py createsuperuser

# Seed demo data (users, students, fee records, payments)
python manage.py seed_demo_data

# Start the development server
python manage.py runserver
# → API available at http://localhost:8000/api/
```

---

### 3. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → App available at http://localhost:3000
```

---

## 🔑 Demo Accounts

| Email                    | Password    | Role       | Access                          |
|--------------------------|-------------|------------|---------------------------------|
| registrar@school.edu     | password123 | Registrar  | Full access — all features      |
| teacher@school.edu       | password123 | Teacher    | Students, Courses (read/write)  |
| student@school.edu       | password123 | Student    | Dashboard only                  |

---

## ✨ Key Features

### 🔐 Role-Based Access Control
| Feature             | Registrar | Teacher | Student |
|---------------------|-----------|---------|---------|
| Dashboard           | ✅        | ✅      | ✅      |
| View Students       | ✅        | ✅      | ❌      |
| Add/Edit Students   | ✅        | ❌      | ❌      |
| Fee Records         | ✅        | ❌      | ❌      |
| Record Payments     | ✅        | ❌      | ❌      |
| View Courses        | ✅        | ✅      | ❌      |
| Manage Users        | ✅        | ❌      | ❌      |

### 💳 60% Auto-Registration Rule
- Every time a payment is saved, the system recalculates the total fees paid for that student.
- If **total paid ÷ total due ≥ 60%**, the student's `is_registered` flag is automatically set to `True`.
- Registrars can also manually register a student via the student detail page.

### 💰 Payment Methods
- **Cash** — simple amount entry
- **Card** — requires last 4 digits, card type (Visa / Mastercard / Amex), and optional reference number

### 📊 Dashboard Analytics
- Total students, registered count, pending registrations
- Total fees collected
- Fee status donut chart (Unpaid / Partial / Paid)
- Collections by payment method (bar chart)
- Revenue overview with progress bar
- Recent payment transactions table

---

## 🌐 API Endpoints

### Auth
| Method | URL                         | Description              | Role       |
|--------|-----------------------------|--------------------------|------------|
| POST   | /api/auth/login/            | Login → JWT tokens       | Public     |
| POST   | /api/auth/logout/           | Blacklist refresh token  | Any        |
| POST   | /api/auth/token/refresh/    | Refresh access token     | Any        |
| GET    | /api/auth/me/               | Current user profile     | Any        |
| GET    | /api/auth/users/            | List all users           | Registrar  |
| POST   | /api/auth/register/         | Create a user            | Registrar  |
| GET    | /api/auth/dashboard/        | Dashboard stats          | Any        |

### Students
| Method | URL                              | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /api/students/                   | List students            |
| POST   | /api/students/                   | Create student           |
| GET    | /api/students/{id}/              | Student detail           |
| PATCH  | /api/students/{id}/              | Update student           |
| POST   | /api/students/{id}/register/     | Manually register        |
| GET    | /api/students/{id}/fee-status/   | Fee summary              |
| GET    | /api/students/programs/          | List programs            |
| GET    | /api/students/academic-years/    | List academic years      |

### Fees
| Method | URL                         | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/fees/records/          | List fee records         |
| POST   | /api/fees/records/          | Create fee record        |
| GET    | /api/fees/payments/         | List payments            |
| POST   | /api/fees/payments/         | Record a payment         |
| GET    | /api/fees/analytics/        | Fee analytics            |
| GET    | /api/fees/types/            | List fee types           |

### Courses
| Method | URL                              | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /api/courses/                    | List courses             |
| POST   | /api/courses/                    | Create course            |
| GET    | /api/courses/enrollments/        | List enrollments         |
| POST   | /api/courses/enrollments/        | Enroll student           |

---

## 🛠 Production Checklist

- [ ] Change `SECRET_KEY` in `settings.py` to a randomly generated value
- [ ] Set `DEBUG = False` in production
- [ ] Set strong MySQL password
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set up HTTPS (nginx + Let's Encrypt)
- [ ] Store secrets in environment variables (use `python-decouple`)
- [ ] Run `python manage.py collectstatic`
- [ ] Use `gunicorn` as the WSGI server
- [ ] Set up a process manager (systemd or supervisor)

---

## 🧰 Tech Stack Details

| Layer       | Technology                          |
|-------------|-------------------------------------|
| DB          | MySQL 8 via `mysqlclient`           |
| ORM         | Django ORM                          |
| API         | Django REST Framework               |
| Auth        | JWT via `djangorestframework-simplejwt` |
| CORS        | `django-cors-headers`               |
| Frontend    | React 18 + Vite                     |
| Routing     | React Router v6                     |
| Data fetch  | React Query v3                      |
| Forms       | React Hook Form                     |
| Charts      | Recharts                            |
| Styling     | Tailwind CSS v3                     |
| Toasts      | react-hot-toast                     |
