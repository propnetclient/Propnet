# PropNet - Local Development Setup

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or higher)
- **Git**

## Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd propnet
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`

#### Create Database
```bash
# Start PostgreSQL service
# Windows: Start via Services
# macOS: brew services start postgresql
# Linux: sudo service postgresql start

# Create database
createdb propnet_dev

# Or via psql:
psql -U postgres
CREATE DATABASE propnet_dev;
\q
```

### 4. Environment Configuration

Create `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/propnet_dev

# Session Security
SESSION_SECRET=your-super-secure-session-secret-key-change-this

# Twilio SMS Configuration (Optional - for OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google Gemini AI (Optional - for property extraction)
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# SendGrid Email (Optional - for notifications)
SENDGRID_API_KEY=your_sendgrid_api_key

# Environment
NODE_ENV=development
```

### 5. Database Migration
```bash
# Push database schema
npm run db:push
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
propnet/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── auth.ts           # Authentication logic
│   └── index.ts          # Server entry point
├── shared/               # Shared TypeScript types
│   └── schema.ts         # Database schema
├── uploads/              # File upload directory
└── package.json          # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## API Services Setup (Optional)

### Twilio SMS
1. Sign up at [twilio.com](https://twilio.com)
2. Get Account SID, Auth Token, and Phone Number
3. Add to `.env` file

### Google Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env` file

### SendGrid Email
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to `.env` file

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Module Not Found Errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production database URL
3. Set secure session secret
4. Configure HTTPS
5. Set up process manager (PM2)

```bash
npm install -g pm2
npm run build
pm2 start server/index.ts --name propnet
```