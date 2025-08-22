# Jupyter AI Notebook

An AI-powered block-based notebook application for data science and analysis, designed for both web and mobile platforms.

## 🚀 Features

- **Block-based Interface**: Create and organize different types of content blocks
- **AI Integration**: Support for multiple AI models (GPT-4, Claude, Gemini)
- **Code Execution**: Run Python, JavaScript, SQL, R, and HTML code
- **Data Visualization**: Generate charts and graphs with Chart.js
- **File Management**: Upload and process various file formats (CSV, JSON, Excel, etc.)
- **Markdown Support**: Rich text editing with live preview
- **Data Input Forms**: Create custom forms for data collection
- **Real-time Execution**: See results instantly as you work
- **Auto-save**: Never lose your work with automatic saving
- **Scheduling**: Set up automated notebook execution
- **Mobile Ready**: Optimized for both desktop and mobile devices

## 📱 Mobile App

This application can be compiled into a native Android APK using Capacitor. The GitHub Actions workflow automatically builds APK files on every release.

### Download

- **Latest APK**: Available in the [Releases](../../releases) section
- **Development APK**: Built automatically on every push to main branch

## 🛠️ Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- For mobile development: Android Studio and Java 17

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/jupyter-ai-notebook.git
cd jupyter-ai-notebook

# Install dependencies
npm install

# Start development server
npm start
```

### Building for Web

```bash
# Build for production
npm run build

# Serve built files
npm start
```

### Building for Android

```bash
# Initialize Capacitor (first time only)
npm run cap:init

# Add Android platform (first time only)
npm run cap:add:android

# Build web assets and sync to native
npm run build
npm run cap:sync

# Build APK
npm run cap:build:android

# Open in Android Studio
npm run cap:open:android
```

## 🧪 Usage

### Getting Started

1. **Create Your First Block**: Click "Add Your First Block" to start
2. **Choose Block Type**:
   - **AI Prompt**: Ask AI to analyze data or generate code
   - **Code**: Write and execute code directly
   - **Text/Markdown**: Add documentation and notes
   - **Data Input**: Create forms for data collection

### Block Types

#### AI Prompt Block 🤖
- Ask AI to analyze your data
- Generate code automatically
- Get insights and recommendations
- Support for multiple AI models

#### Code Block 💻
- Write and execute code in multiple languages
- Real-time syntax highlighting
- Instant execution with output display
- Support for Python, JavaScript, SQL, R, HTML

#### Markdown Block 📝
- Rich text editing with live preview
- Support for headers, lists, code blocks
- Perfect for documentation and notes
- Toggle between edit and preview modes

#### Data Input Block 📊
- Create custom forms for data collection
- Multiple field types (text, number, date, etc.)
- Collect and organize data efficiently
- Export collected data for analysis

### File Management

- **Upload Files**: Support for CSV, JSON, Excel, Python, JavaScript, HTML, SQL files
- **File Browser**: Easy access to uploaded files in the sidebar
- **Data Integration**: Use uploaded files in your analysis blocks

### AI Integration

Configure your AI API keys in Settings:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save notebook
- `Ctrl/Cmd + M`: Add new block
- `Shift + Enter`: Execute current block

## 🔧 Configuration

### Settings

Access settings via the gear icon in the header:

- **AI Model**: Choose your preferred AI model
- **API Keys**: Configure your AI service API keys
- **Auto-execution**: Enable/disable automatic code execution
- **Auto-save**: Enable/disable automatic saving

### Scheduling

Set up automated notebook execution:

- **Frequency**: Hourly, daily, weekly, or monthly
- **Email Notifications**: Get notified when notebooks run
- **Email Configuration**: Set up notification email

## 🏗️ Architecture

### Frontend
- **HTML5**: Semantic markup with accessibility in mind
- **CSS3**: Modern styling with CSS custom properties
- **JavaScript**: ES6+ with modular architecture
- **Chart.js**: Data visualization library
- **Marked**: Markdown parsing and rendering

### Mobile
- **Capacitor**: Web-to-native bridge
- **Android**: Native Android app generation
- **Progressive Web App**: Web app with native features

### Build System
- **npm**: Package management and scripts
- **Capacitor CLI**: Mobile app building
- **GitHub Actions**: Automated CI/CD pipeline

## 📦 Deployment

### Automatic Deployment

Every push to the main branch triggers:
1. Web asset compilation
2. APK generation
3. Artifact upload to GitHub

### Manual Deployment

For web deployment:
```bash
npm run build
# Deploy the 'dist' folder to your web server
```

For mobile deployment:
```bash
npm run cap:build:android
# APK will be in android/app/build/outputs/apk/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features in [GitHub Issues](../../issues)
- **Discussions**: Join the conversation in [GitHub Discussions](../../discussions)
- **Documentation**: Check the [Wiki](../../wiki) for detailed guides

## 🙏 Acknowledgments

- **Chart.js**: For beautiful data visualizations
- **Marked**: For markdown rendering
- **Capacitor**: For web-to-native capabilities
- **GitHub Actions**: For automated builds and deployment

---

Built with ❤️ for the data science and AI community