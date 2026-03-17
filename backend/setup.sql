-- ============================================================
-- EduRegister — MySQL Database Setup Script
-- Run this once before starting the Django backend
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_registration_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'eduregister'@'localhost' IDENTIFIED BY 'admin123!';
GRANT ALL PRIVILEGES ON student_registration_db.* TO 'eduregister'@'localhost';
FLUSH PRIVILEGES;

USE student_registration_db;

-- Django will create all tables via migrations.
-- Run: python manage.py migrate

-- ── Optional: seed demo data after migrations ──────────────────────────────
-- Use the management command: python manage.py seed_demo_data
