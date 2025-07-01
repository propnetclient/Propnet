# PropNet - Dependencies and Setup Guide

## System Requirements

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)
- **PostgreSQL**: v14.0 or higher
- **Git**: Latest version

### Operating System Support
- Windows 10/11
- macOS 10.15+
- Ubuntu 20.04+
- Any Linux distribution with Node.js support

## Core Dependencies (package.json)

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.2.2",
  "vite": "^4.4.5",
  "@vitejs/plugin-react": "^4.0.3",
  "tailwindcss": "^3.3.0",
  "wouter": "^2.12.1",
  "@tanstack/react-query": "^4.32.6"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "drizzle-orm": "^0.28.5",
  "@neondatabase/serverless": "^0.6.0",
  "bcrypt": "^5.1.1",
  "express-session": "^1.17.3",
  "connect-pg-simple": "^9.0.1",
  "multer": "^1.4.5-lts.1"
}
```

### API Integrations (Optional)
```json
{
  "@google/generative-ai": "^0.1.3",
  "@sendgrid/mail": "^7.7.0",
  "twilio": "^4.15.0"
}
```

## Installation Commands

### 1. Install Node.js
```bash
# Windows (using Chocolatey)
choco install nodejs

# macOS (using Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or download from https://nodejs.org
```

### 2. Install PostgreSQL
```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

### 3. Clone and Setup Project
```bash
git clone <repository-url>
cd propnet
npm install
```

### 4. Database Setup
```bash
# Create database
createdb propnet_dev

# Alternative: Using psql
psql -U postgres
CREATE DATABASE propnet_dev;
\q
```

### 5. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://username:password@localhost:5432/propnet_dev
SESSION_SECRET=your-secure-secret-key
```

### 6. Initialize Database
```bash
npm run db:push
```

### 7. Start Development Server
```bash
npm run dev
```

## Quick Start for Different Platforms

### Windows Setup
```powershell
# Install Node.js from nodejs.org
# Install PostgreSQL from postgresql.org
# Clone project
git clone <repo-url>
cd propnet
npm install
# Setup .env file
npm run db:push
npm run dev
```

### macOS Setup
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql git
brew services start postgresql

# Setup project
git clone <repo-url>
cd propnet
npm install
createdb propnet_dev
# Setup .env file
npm run db:push
npm run dev
```

### Ubuntu/Debian Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib git
sudo service postgresql start

# Setup project
git clone <repo-url>
cd propnet
npm install
sudo -u postgres createdb propnet_dev
# Setup .env file
npm run db:push
npm run dev
```

## Docker Alternative (Optional)

### Using Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: propnet_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/propnet_dev
      SESSION_SECRET: your-secure-secret

volumes:
  postgres_data:
```

### Docker Commands
```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Troubleshooting

### Common Issues

#### Port 5000 Already in Use
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=3000 npm run dev
```

#### Database Connection Failed
```bash
# Check PostgreSQL status
# Windows: Services -> PostgreSQL
# macOS: brew services list | grep postgresql
# Linux: sudo service postgresql status

# Reset database connection
sudo -u postgres psql
\l  # List databases
\q  # Quit
```

#### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Permission Denied (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Development Tools

#### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- PostgreSQL (by Chris Kolkman)
- Thunder Client (API testing)

#### Useful npm Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Update database schema
npm run db:studio    # Open database GUI
npm run type-check   # TypeScript type checking
npm run lint         # Code linting
```

## Production Deployment Notes

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
SESSION_SECRET=<secure-random-string>
PORT=5000
```

### Build and Deploy
```bash
npm run build
npm start

# Or with PM2 process manager
npm install -g pm2
pm2 start npm --name "propnet" -- start
pm2 save
pm2 startup
```