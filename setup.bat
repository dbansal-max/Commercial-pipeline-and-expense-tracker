@echo off
echo 🚀 Finance Management System Setup Script
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!

REM Setup Backend
echo.
echo 📦 Setting up Backend...
cd backend

REM Install dependencies
echo 📥 Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Copy environment file
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your database and email credentials
)

REM Setup Frontend
echo.
echo 📦 Setting up Frontend...
cd ..\frontend

REM Install dependencies
echo 📥 Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Copy environment file
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
)

REM Go back to root
cd ..

echo.
echo ✅ Setup completed successfully!
echo.
echo 📋 Next Steps:
echo 1. Edit backend\.env with your database and email credentials
echo 2. Create a PostgreSQL database named 'finance_management'
echo 3. Run: cd backend && node scripts\run-migrations.js
echo 4. Run: cd backend && node scripts\create-admin.js
echo 5. Start backend: cd backend && npm start
echo 6. Start frontend: cd frontend && npm start
echo.
echo 🔐 Default Admin Credentials:
echo    Email: admin@finance.com
echo    Password: admin123456
echo.
echo 📚 For more information, see README.md
pause
