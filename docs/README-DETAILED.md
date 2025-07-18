# AiVello - Free AI-Powered Daily Tools 🚀

A modern React application providing 10+ free AI-powered productivity tools including PDF converters, image tools, text utilities, and more.

## ✨ Features

- **🔄 PDF to Word Converter** - Convert PDF files to editable Word documents
- **🖼️ Background Remover** - Remove backgrounds from images using AI
- **📝 Grammar Checker** - AI-powered grammar and spell checking
- **🗜️ Image Compressor** - Reduce image file sizes while maintaining quality
- **📱 QR Code Generator** - Create custom QR codes for various purposes
- **🎵 Text to Speech** - Convert text to natural-sounding audio
- **📊 Word Counter** - Count words, characters, and estimate reading time
- **⏱️ Reading Time Estimator** - Calculate estimated reading time for content
- **📄 Resume Builder** - Create professional resumes with AI assistance
- **🎥 YouTube Thumbnail Downloader** - Download video thumbnails in various sizes

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Authentication**: Firebase Auth (Google & GitHub)
- **State Management**: React Context
- **Icons**: React Icons
- **Animations**: Framer Motion
- **SEO**: Custom React 19 compatible solution
- **Build Tool**: Create React App

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Raguvaasan/aivello.git
   cd aivello
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎨 Logo & Branding

The project includes a modern logo system with:

- **Text-based logo** with gradient colors (blue to purple)
- **Icon version** for favicons and small spaces
- **SVG format** for scalability
- **PNG generator** (`logo-generator.html`) for creating different sizes

### Generate PNG Logos
Open `logo-generator.html` in your browser to create PNG versions in various sizes:
- Favicon (16×16, 32×32)
- PWA icons (192×192, 512×512)
- Custom sizes for different use cases

## 📱 Progressive Web App (PWA)

AiVello is PWA-ready with:
- Service worker for offline functionality
- App manifest for installation
- Responsive design for all devices
- Fast loading with optimized bundles

## 🔍 SEO Optimization

Comprehensive SEO implementation:
- **Dynamic meta tags** for each page/tool
- **Structured data** (JSON-LD) for rich snippets
- **Open Graph** and **Twitter Card** support
- **XML sitemap** with proper priorities
- **Page-specific optimization** for all tools

## 🔐 Authentication

Secure authentication system:
- **Google Sign-in** integration
- **GitHub Sign-in** support
- **Protected routes** for authenticated features
- **User profile** management
- **Usage history** tracking

## 🌙 Dark Mode

Built-in theme system:
- Light and dark mode support
- System preference detection
- Smooth transitions
- Persistent user preferences

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Configure redirects for SPA routing

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components (SEO, Loading, etc.)
│   ├── landing/        # Landing page components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── tools/          # AI tool components
│   └── ui/             # UI components (Button, Card, etc.)
├── context/            # React context providers
├── data/               # Static data and SEO configurations
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── routes/             # Route configurations
├── tools/              # Tool implementations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎯 Status: All Issues Fixed! ✅

### ✅ **Resolved Issues:**
1. **React 19 Compatibility** - Fixed dependency conflicts with react-helmet-async
2. **SEO Implementation** - Custom React 19 compatible SEO solution
3. **Authentication Bug** - Fixed double-click login issue
4. **Logo System** - Modern text-based logo with gradient design
5. **TypeScript Errors** - All compilation errors resolved
6. **Production Build** - Successfully building for deployment

### ✅ **Current Application Status:**
- **✅ Running perfectly** at http://localhost:3000
- **✅ No TypeScript errors** or compilation issues
- **✅ Production build** ready for deployment
- **✅ All AI tools** functioning properly
- **✅ SEO optimization** complete with meta tags and structured data
- **✅ Authentication** working with single-click login
- **✅ Logo system** implemented with PNG generator

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-tool`
3. Commit changes: `git commit -am 'Add new AI tool'`
4. Push to branch: `git push origin feature/new-tool`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Raguvaasan/aivello/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Raguvaasan/aivello/discussions)
- **Email**: support@aivello.com

## 🙏 Acknowledgments

- React team for the amazing framework
- Firebase for authentication services
- Tailwind CSS for the utility-first CSS framework
- All the AI libraries that power our tools

---

**Made with ❤️ by the AiVello Team**

🌐 **Live Demo**: [https://aivello.vercel.app](https://aivello.vercel.app)
