# Weave - Desktop Application

Weave is a powerful visual circuit design and documentation tool, now available as a desktop application built with Electron.

## Features

- **Visual Circuit Design**: Create and manage complex circuit diagrams with an intuitive canvas interface
- **Product Library**: Manage components and blocks with custom templates
- **Smart Routing**: Automatic connection routing with collision detection
- **PDF Support**: Import and work with PDF schematics
- **AI Integration**: Gemini AI-powered features for smart part extraction
- **Export Options**: Export your designs as images or PDFs
- **Desktop Native**: Runs as a native desktop application on Windows

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or pnpm package manager

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build
```

## Development

### Project Structure

```
Weave Final/
├── electron/           # Electron main process files
│   ├── main.ts        # Main process entry point
│   ├── preload.ts     # Preload script for secure IPC
│   └── tsconfig.json  # TypeScript config for Electron
├── components/         # React components
├── hooks/             # Custom React hooks
├── services/          # Business logic and services
├── utils/             # Utility functions
├── types.ts           # TypeScript type definitions
└── App.tsx            # Main React application
```

### Available Scripts

- `npm run dev` - Start Vite dev server (web only)
- `npm run build` - Build web application
- `npm run electron:compile` - Compile Electron TypeScript files
- `npm run electron:dev` - Run Electron app in development mode
- `npm run electron:build` - Build production Electron app

### Technologies Used

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Desktop Framework**: Electron
- **UI Icons**: Lucide React
- **PDF Processing**: PDF.js
- **AI**: Google Gemini API
- **Canvas Rendering**: HTML2Canvas

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```
GEMINI_API_KEY=your_api_key_here
```

### Vite Configuration

The project uses a custom Vite configuration optimized for Electron:

- Build target: `esnext` (supports top-level await)
- Output format: ES modules
- Dev server: Port 3000

### Electron Builder

Configured for Windows builds with NSIS installer. Customize in `package.json` under the `build` section.

## Building for Distribution

To create a distributable Windows executable:

```bash
npm run electron:build
```

The installer will be created in the `release/` directory.

### Custom Icon

To use a custom application icon:

1. Create a `build/` directory in the project root
2. Add your icon as `build/icon.ico`
3. Run the build command

## Usage

### Running the App

1. Launch the application
2. Use the left sidebar to manage your component library
3. Drag components onto the canvas
4. Create connections between components
5. Use the right sidebar to adjust properties
6. Save your project or export as image/PDF

### Keyboard Shortcuts

- `Ctrl+S` - Save project
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Delete` - Delete selected items
- `Ctrl+C` - Copy selected items
- `Ctrl+V` - Paste items

## Troubleshooting

### App Won't Start

- Ensure all dependencies are installed: `npm install`
- Check that Node.js version is 18 or higher
- Try deleting `node_modules` and reinstalling

### Build Errors

- Clear the dist folders: `rm -rf dist dist-electron`
- Rebuild: `npm run build && npm run electron:compile`

### Development Mode Issues

- Ensure port 3000 is not in use
- Check that the Vite dev server starts successfully
- Look for errors in the Electron DevTools console

## License

This project is private and proprietary.

## Version

v1.0.0 - Electron Desktop Application

---

**Note**: This application requires a valid Gemini API key for AI-powered features. Configure it in the `.env.local` file before running.
