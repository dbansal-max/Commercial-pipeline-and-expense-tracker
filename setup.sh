#!/bin/bash

echo "🚀 Finance Management System Setup Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version is too old. Please install Node.js v16 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v12 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

# Install dependencies
echo "📥 Installing backend dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database and email credentials"
fi

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

# Go back to root
cd ..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit backend/.env with your database and email credentials"
echo "2. Create a PostgreSQL database named 'finance_management'"
echo "3. Run: cd backend && node scripts/run-migrations.js"
echo "4. Run: cd backend && node scripts/create-admin.js"
echo "5. Start backend: cd backend && npm start"
echo "6. Start frontend: cd frontend && npm start"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Email: admin@finance.com"
echo "   Password: admin123456"
echo ""
echo "📚 For more information, see README.md"
