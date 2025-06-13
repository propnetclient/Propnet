# Production Deployment Guide

## Prerequisites - Your Input Required

### 1. Twilio SMS Service Setup
Create a Twilio account and obtain:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Production Domain & SSL
- Domain name (e.g., yourdomain.com)
- SSL certificate through hosting provider
- BASE_URL=https://yourdomain.com

### 3. Secure Session Secret
Generate a 256-bit random secret:
```bash
# Run this command to generate:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Cloud Storage (Recommended)
For file uploads, set up:
- AWS S3 bucket OR
- Google Cloud Storage OR
- Cloudinary account

## Environment Variables Needed

Create `.env` file with:
```bash
# Database (already configured)
DATABASE_URL=postgresql://...

# Authentication & Security
SESSION_SECRET=your_256_bit_random_secret
NODE_ENV=production
BASE_URL=https://yourdomain.com

# SMS Service
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# APIs (already configured)
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_maps_key

# Optional: Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
```

## Deployment Steps

### 1. Install Twilio (if using SMS)
```bash
npm install twilio
```

### 2. Build Application
```bash
npm run build
```

### 3. Database Migration
```bash
npm run db:push
```

### 4. Start Production Server
```bash
npm start
```

## Security Checklist

- [x] Environment variables protected in .gitignore
- [x] Session security with PostgreSQL store
- [x] Input validation on all endpoints
- [x] File upload restrictions
- [x] Rate limiting on authentication
- [x] Security headers implemented
- [ ] SSL certificate configured
- [ ] SMS service integrated
- [ ] Error monitoring setup

## Performance Optimizations

### Immediate (Required)
- [x] Database connection pooling
- [x] Request payload size limits
- [x] Session persistence

### Recommended
- [ ] Redis caching for API responses
- [ ] Image optimization pipeline
- [ ] CDN for static assets
- [ ] Database query optimization

## Monitoring Setup

### Error Tracking
Recommended services:
- Sentry (error monitoring)
- LogRocket (user session recording)
- DataDog (infrastructure monitoring)

### Health Checks
Monitor these endpoints:
- GET /api/auth/me (authentication)
- GET /api/properties (database connectivity)
- POST /api/auth/send-otp (SMS service)

## Testing Checklist

### Authentication Flow
- [ ] OTP generation and delivery
- [ ] OTP validation with rate limiting
- [ ] Session persistence across requests
- [ ] Logout functionality

### Property Management
- [ ] Property creation with file uploads
- [ ] Property listing and search
- [ ] Owner approval workflow
- [ ] Co-listing requests

### Mobile Experience
- [ ] Responsive design on mobile devices
- [ ] Touch interactions work properly
- [ ] PWA installation prompt
- [ ] Offline functionality (basic)

## Common Issues & Solutions

### Issue: "SMS service not configured"
**Solution**: Add Twilio credentials to environment variables

### Issue: "Session not persisting"
**Solution**: Ensure SSL is enabled and SESSION_SECRET is set

### Issue: "File uploads failing"
**Solution**: Check upload directory permissions and file size limits

### Issue: "Database connection errors"
**Solution**: Verify DATABASE_URL and network connectivity

## Post-Deployment Verification

1. **Authentication**: Test OTP flow with real phone number
2. **File Uploads**: Test property creation with images
3. **Database**: Verify data persistence and queries
4. **Performance**: Check response times under load
5. **Security**: Run security scan on deployed URL

## Rollback Plan

If deployment fails:
1. Keep previous version running
2. Check error logs for specific issues
3. Verify all environment variables
4. Test database connectivity
5. Validate SSL certificate

## Support Contact

For deployment issues:
1. Check server logs: `npm run logs`
2. Verify environment variables
3. Test database connectivity
4. Check SSL certificate status