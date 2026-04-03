# Finance Management System

A comprehensive finance data processing and access control backend built with Node.js, Express, and PostgreSQL.

## Features

### User and Role Management
- User registration and authentication with JWT tokens
- Role-based access control (Admin, Finance Manager, Analyst, Employee, Viewer, User)
- Permission-based authorization system
- User profile management

### Financial Records Management
- CRUD operations for financial records
- Role-based record access (users can only see their own records unless elevated role)
- Edit/delete request workflow for non-admin users
- Advanced filtering and search capabilities

### Dashboard Summary APIs
- Monthly and yearly financial summaries
- Category-wise expense analysis
- Financial trends and insights
- Expense reduction recommendations
- System health monitoring

### Access Control Logic
- Middleware-based authentication and authorization
- Granular permission system
- Self-data access or admin-only access patterns
- Request approval workflow

### Validation and Error Handling
- Input validation using Joi
- Comprehensive error responses
- Proper HTTP status codes
- Global error handling middleware

### Data Persistence
- PostgreSQL database with Sequelize ORM
- Database migrations and seeding
- Soft delete functionality
- Email logging and audit trails

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens
- **Security**: Helmet, CORS, Rate limiting
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Joi

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd finance-management-system
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend (optional)
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Set up the database:
```bash
npm run migrate
npm run seed
```

5. Start the application:
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/admin-register` - Admin user registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Financial Records
- `POST /api/records` - Create financial record
- `GET /api/records` - Get all financial records (with filtering)
- `GET /api/records/:id` - Get specific record
- `PUT /api/records/:id` - Update record (admin direct, others via request)
- `DELETE /api/records/:id` - Delete record (admin direct, others via request)

### Dashboard
- `GET /api/dashboard/monthly` - Monthly summary
- `GET /api/dashboard/yearly` - Yearly summary
- `GET /api/dashboard/category-wise` - Category-wise analysis
- `GET /api/dashboard/trends` - Financial trends
- `GET /api/dashboard/reduction-plan` - Expense reduction plan
- `GET /api/dashboard/system-health` - System health metrics

### Users & Roles
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `GET /api/roles` - Get all roles (admin only)
- `POST /api/roles/assign` - Assign role to user (admin only)

## Role Permissions

### Admin
- Full access to all features
- Can manage users and roles
- Can approve/reject edit/delete requests
- Can manage system settings

### Finance Manager
- Can create and edit all records
- Cannot delete records
- Can approve requests
- Cannot manage users/roles

### Analyst
- Read-only access to all records
- Can access dashboard summaries
- Cannot create/edit/delete records

### Employee/User
- Can create and edit own records
- Cannot delete records
- Limited to own data access

### Viewer
- Read-only access to own records
- Cannot create/edit/delete records
- Basic dashboard access

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation and sanitization
- SQL injection prevention via ORM
- File upload restrictions

## Database Schema

The system uses the following main tables:
- `users` - User accounts and profiles
- `roles` - Role definitions and permissions
- `financial_records` - Financial transaction records
- `edit_delete_requests` - Approval workflow requests
- `email_logs` - Email communication tracking
- `app_settings` - Application configuration

## Development Notes

- The system uses soft deletes (`is_deleted` flag) for data integrity
- All timestamps are in UTC
- Email notifications are configured via environment variables
- The API includes comprehensive health check endpoints

## License

MIT License - see LICENSE file for details
