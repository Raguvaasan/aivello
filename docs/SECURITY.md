# Security Guidelines - Aivello

## Overview
This document outlines the security measures implemented in the Aivello application and best practices for maintaining security.

## Environment Variables Security

### API Keys Protection
- All sensitive API keys are moved to environment variables
- `.env.local` is gitignored to prevent accidental commits
- Use `.env.example` as a template for required environment variables

### Required Environment Variables
```bash
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_REMOVE_BG_API_KEY=your_remove_bg_api_key
REACT_APP_ENV=development
```

## Firebase Security

### Authentication
- Proper Firebase authentication rules implemented
- Protected routes ensure only authenticated users can access sensitive areas
- User sessions are handled securely

### Firestore Security Rules
Implement these rules in your Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tool usage history (optional logging)
    match /bgRemovalHistory/{document} {
      allow create: if request.auth != null;
      allow read: if false; // No reading of history data
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## API Security

### Input Validation
- File type validation for uploads
- File size limits enforced (10MB max)
- Timeout protection for API requests (30 seconds)

### Error Handling
- Centralized error handling prevents information leakage
- API errors are sanitized before displaying to users
- Detailed errors are logged securely (not exposed to client)

### API Rate Limiting
Consider implementing rate limiting in production:
- Limit requests per user/IP
- Implement exponential backoff
- Monitor for abuse patterns

## Content Security Policy

Add to your `public/index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  connect-src 'self' https://api.remove.bg https://*.firebaseapp.com https://*.googleapis.com;
  font-src 'self' data:;
  object-src 'none';
  media-src 'self' blob:;
  frame-src 'none';
">
```

## Data Privacy

### User Data Handling
- Minimal data collection
- Images processed client-side when possible
- Temporary files cleaned up after processing
- No persistent storage of user content

### Third-Party Services
- Remove.bg: Images are processed but not stored permanently
- Firebase: Only authentication and minimal usage analytics

## Deployment Security

### Vercel Configuration
Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Environment-Specific Configurations
- Development: Enhanced error logging, debugging tools enabled
- Production: Analytics enabled, error logging to external service

## Security Checklist

### Before Deployment
- [ ] All API keys moved to environment variables
- [ ] `.env.local` added to `.gitignore`
- [ ] Firebase security rules configured
- [ ] Input validation implemented
- [ ] Error handling centralized
- [ ] CSP headers configured
- [ ] Security headers added
- [ ] File upload limits enforced
- [ ] API timeouts configured

### Regular Maintenance
- [ ] Update dependencies regularly
- [ ] Monitor for security vulnerabilities
- [ ] Review Firebase usage and billing
- [ ] Check API usage limits
- [ ] Monitor error logs for abuse patterns
- [ ] Review and update security headers

## Incident Response

### If API Key Exposed
1. Immediately revoke the exposed key
2. Generate new API keys
3. Update environment variables
4. Deploy updated configuration
5. Monitor for unauthorized usage

### If Security Vulnerability Found
1. Assess impact and severity
2. Implement fix if possible
3. Update dependencies if needed
4. Deploy fix immediately
5. Document incident and resolution

## Contact
For security concerns or to report vulnerabilities, please contact the development team.

---

**Note**: This document should be kept up-to-date as the application evolves and new security measures are implemented.
