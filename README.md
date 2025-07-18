# Aivello - Free AI-Powered Daily Tools

A comprehensive web application offering 10+ free AI-powered tools for everyday productivity tasks.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (for authentication)
- Remove.bg API key (for background removal)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Raguvaasan/aivello.git
   cd aivello
   ```

2. **Setup development environment**
   ```bash
   ./scripts/setup-dev.sh
   ```

3. **Configure environment variables**
   ```bash
   # Edit .env.local with your API keys
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
aivello/
├── .github/                 # GitHub workflows and templates
│   ├── workflows/          # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/     # Bug reports, feature requests
│   └── copilot-instructions.md
├── docs/                   # Comprehensive documentation
│   ├── SECURITY.md         # Security guidelines
│   ├── SEO_GUIDE.md        # SEO implementation
│   └── README.md           # Documentation index
├── public/                 # Static assets and PWA files
├── src/                    # Source code
│   ├── components/         # React components
│   ├── tools/             # AI tool implementations
│   ├── pages/             # Application pages
│   ├── context/           # React contexts
│   └── utils/             # Utility functions
├── scripts/                # Development and build scripts
├── tools/                  # Development tools (logo generators)
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Raguvaasan/aivello.git
cd aivello
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API keys
nano .env.local
```

Required environment variables:
```env
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

### 4. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Add your domain to Firebase Auth authorized domains

### 5. Start development server
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - TypeScript type checking

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   ├── landing/        # Landing page components
│   ├── layout/         # Layout components
│   └── ui/            # Basic UI components
├── tools/              # Individual tool implementations
├── pages/              # Page components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── config/             # Configuration files
├── services/           # API services
├── utils/              # Utility functions
├── constants/          # Application constants
└── types/             # TypeScript type definitions
```

## 🔒 Security

This project implements several security measures:

- Environment variables for sensitive data
- Input validation and sanitization
- File type and size restrictions
- Secure Firebase configuration
- Error handling without information leakage

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- Firebase Hosting
- AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

If you find a bug, please open an issue with:
- Bug description
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Browser/OS information

## 📞 Support

- **Documentation**: Check this README and [SECURITY.md](./SECURITY.md)
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas

## 🙏 Acknowledgments

- [Remove.bg](https://remove.bg) for background removal API
- [Firebase](https://firebase.google.com) for backend services
- [Tailwind CSS](https://tailwindcss.com) for styling
- [React](https://reactjs.org) and the amazing React ecosystem

---

Made with ❤️ by the Aivello team

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
