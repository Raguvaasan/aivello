# GitHub Copilot Instructions for Aivello Project

## ⚠️ Critical Requirements
- No empty files should be committed to the repository
- All files must have proper implementation or documentation
- Every component must have proper TypeScript types
- All tools are free to use without restrictions
- User activity must be tracked in Firestore
- Performance scores must meet minimum thresholds:
  * Mobile & Desktop Performance: > 85
  * Accessibility: > 90
  * Best Practices: > 90
  * SEO: > 90

## 🎯 Project Overview
Aivello is a React 19 + TypeScript web application providing 10+ free AI-powered productivity tools. The project emphasizes security, performance, and responsive design across all platforms.

## 🏗️ Architecture Guidelines

### Core Technologies
- **Frontend**: React 19.1.0 with TypeScript 4.9.5
- **Styling**: Tailwind CSS 3.4.1 with dark mode support
- **Authentication**: Firebase Auth with Google/GitHub sign-in
- **Database**: Firestore for user data and history
- **Routing**: React Router DOM 7.6.3
- **Animations**: Framer Motion 12.23.3
- **Build**: Create React App with custom Webpack config

### File Structure Patterns
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable UI components
│   ├── landing/        # Landing page components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── ui/            # Base UI components (button, input, etc.)
├── tools/             # Individual tool implementations
├── pages/             # Page-level components
├── context/           # React Context providers
├── config/            # Configuration files
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
└── data/              # Static data and constants
```

## 🔒 Security Requirements

### Environment Variables
- **ALWAYS** use environment variables for API keys and sensitive data
- Use `REACT_APP_` prefix for client-side environment variables
- Never hardcode API keys or Firebase config in source code
- Reference: `src/config/environment.ts` for proper implementation

### Firebase Security
- Implement proper Firestore security rules for user data isolation
- Use Firebase Auth guards for protected routes
- Validate user permissions before database operations
- Log security events for monitoring

### Input Validation
- Sanitize all user inputs before processing
- Implement file type and size validation for uploads
- Use proper error handling to avoid information leakage
- Add rate limiting for API-heavy operations

### Dependencies Security
- **Priority**: Address npm security vulnerabilities (currently 11 vulnerabilities)
- Regularly audit dependencies with `npm audit`
- Keep React and core dependencies updated
- Remove unused dependencies to reduce attack surface

## ⚡ Performance Optimization

### Bundle Size and Performance Management
- **Critical**: Current bundle must be optimized below 400KB through code splitting
- Use React.lazy() and Suspense for tool components
- Split vendor libraries from application code
- Implement dynamic imports for large tools (TensorFlow.js, PDF libraries)
- Optimize Core Web Vitals:
  * First Contentful Paint (FCP) < 2s
  * Largest Contentful Paint (LCP) < 2.5s
  * First Input Delay (FID) < 100ms
  * Cumulative Layout Shift (CLS) < 0.1
- Image Optimization:
  * Use WebP format with fallbacks
  * Implement responsive images with srcset
  * Lazy load images below the fold
  * Optimize image quality/size ratio
- Code Optimization:
  * Minimize unused JavaScript
  * Remove unused CSS
  * Use tree shaking
  * Implement route-based code splitting
- Caching Strategy:
  * Implement service worker for PWA
  * Cache static assets
  * Use HTTP caching headers
  * Implement browser caching policies

### Component Optimization
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders with useCallback/useMemo
- Use React DevTools Profiler to identify bottlenecks

### Loading Strategy
```typescript
// Example: Lazy load tools
const BgRemover = lazy(() => import('../tools/BgRemover'));
const PdfToWord = lazy(() => import('../tools/PdfToWord'));

// Wrap in Suspense with loading fallback
<Suspense fallback={<LoadingScreen />}>
  <BgRemover />
</Suspense>
```

### Asset Optimization
- Implement image lazy loading with `loading="lazy"`
- Use next-gen image formats (WebP, AVIF) when possible
- Compress and optimize static assets
- Configure proper caching headers for static files

## 📱 Mobile-First Responsive Design

### Breakpoint Strategy
- **Mobile First**: Design for mobile, enhance for desktop
- Use Tailwind responsive prefixes: `sm:` (640px+), `md:` (768px+), `lg:` (1024px+), `xl:` (1280px+)
- Test on actual devices, not just browser dev tools
- Ensure touch targets are minimum 44px

### Layout Patterns
```typescript
// Example responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  
// Example responsive sidebar
<div className={`
  fixed md:sticky top-0 left-0 z-40 h-full w-72
  ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  md:translate-x-0 transition-transform duration-300
`}>
```

### Mobile UX Considerations
- Implement touch gestures where appropriate
- Use mobile-friendly modals and overlays
- Optimize form inputs for mobile keyboards
- Ensure proper keyboard navigation support

## 🎨 UI/UX Guidelines

### Theme System
- Support both light and dark modes
- Use CSS custom properties for dynamic theming
- Ensure proper contrast ratios (WCAG AA compliance)
- Implement smooth transitions between themes

### Component Library
- Use the established UI components in `src/components/ui/`
- Follow consistent spacing using Tailwind's spacing scale
- Implement proper focus states for accessibility
- Use semantic HTML elements

### Animation Guidelines
- Use Framer Motion for complex animations
- Keep animations under 300ms for UI feedback
- Provide `prefers-reduced-motion` respect
- Use animations to enhance UX, not distract

## 🛠️ Tool Development Standards

### Tool Component Structure
```typescript
interface ToolProps {
  // Define clear prop interfaces
}

const ToolComponent: React.FC<ToolProps> = () => {
  // 1. State management
  // 2. Effect hooks
  // 3. Event handlers
  // 4. Render logic with proper loading/error states
  
  return (
    <ToolWrapper title="Tool Name" description="Tool description">
      {/* Tool implementation */}
    </ToolWrapper>
  );
};
```

### File Processing Guidelines
- Always validate file types and sizes
- Implement progress indicators for long operations
- Use client-side processing when possible for privacy
- Provide clear error messages for failures
- Clean up temporary data after processing

### SEO Integration
- Use `SEOHelmet` component for meta tags
- Include structured data for tools
- Implement proper URL structure
- Add breadcrumbs for navigation

## 🧪 Testing Standards

### Component Testing
- Write unit tests for utility functions
- Test component rendering and interactions
- Mock external API calls in tests
- Use React Testing Library best practices

### Performance Testing
- Monitor bundle size with each build
- Test Core Web Vitals (LCP, FID, CLS)
- Use Lighthouse for performance audits
- Test on various devices and network conditions

## 🚀 Deployment Guidelines

### Build Optimization
- Ensure `npm run build` completes without warnings
- Analyze bundle with `npm run build:analyze`
- Configure proper environment variables for production
- Test production build locally before deployment

### Vercel Configuration
- Use the existing `vercel.json` configuration
- Ensure proper headers for security and caching
- Configure environment variables in Vercel dashboard
- Monitor deployment metrics and errors

## 📝 Code Style Guidelines

### TypeScript Standards
- Use strict TypeScript configuration
- Define proper interfaces for all props and data
- Avoid `any` types - use proper type definitions
- Export types from dedicated type files

### React Patterns
- Use functional components with hooks
- Implement proper error boundaries
- Follow React 19 best practices
- Use Context sparingly - prefer props for simple state

### CSS/Tailwind
- Use Tailwind utility classes consistently
- Create custom components for repeated patterns
- Maintain proper class organization (layout → spacing → typography → colors)
- Use the established color palette and spacing scale

## 🔄 Maintenance Guidelines

### Regular Tasks
- Update dependencies monthly
- Run security audits weekly
- Monitor performance metrics
- Review and update documentation

### Code Reviews
- Ensure all security guidelines are followed
- Check for performance implications
- Verify mobile responsiveness
- Test accessibility features

### Error Handling
- Implement proper error boundaries
- Use centralized error logging
- Provide meaningful user feedback
- Monitor error rates and patterns

## 🎯 Development Priorities

### High Priority
1. **Security**: Fix npm vulnerabilities immediately
2. **Performance**: Implement code splitting to reduce bundle size
3. **Mobile**: Enhance mobile user experience for all tools
4. **PWA**: Complete Progressive Web App implementation

### Medium Priority
1. **Testing**: Increase test coverage
2. **Accessibility**: Improve WCAG compliance
3. **Monitoring**: Implement error tracking and analytics
4. **Documentation**: Keep inline documentation updated

### Low Priority
1. **Features**: Add new tools based on user feedback
2. **Optimization**: Fine-tune animations and transitions
3. **Refactoring**: Improve code organization where needed

---

## 💡 Quick Reference Commands

```bash
# Development
npm start                 # Start development server
npm run build            # Production build
npm run test            # Run tests
npm audit               # Check security vulnerabilities
npm run lint            # Lint code
npm run type-check      # TypeScript checking

# Performance Analysis
npm run build:analyze   # Analyze bundle size
npx lighthouse http://localhost:3000 # Performance audit
```

Remember: Always prioritize security, performance, and user experience in that order. When in doubt, refer to the existing codebase patterns and this guide.
