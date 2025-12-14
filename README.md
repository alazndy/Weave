# 🕸️ T-Weave: Advanced Schematic Designer

**TEK Ekosistemi**'nin şematik tasarım uygulaması olan **T-Weave**, sistem şemaları, kablo diyagramları ve bağlantı akışları tasarlamak için güçlü bir masaüstü uygulamasıdır. **Electron** ve **React** ile inşa edilmiştir.

![Status](https://img.shields.io/badge/Status-Stable-success)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)
![Tech](https://img.shields.io/badge/Tech-Electron%20%7C%20React%20%7C%20SVG-black)

## ✨ Key Features

- **🎨 Infinite Canvas**: High-performance SVG-based canvas with infinite panning and smooth zooming.
- **Drag & Drop Design**:
  - **Library Integration**: Seamlessly drag components from the side library and drop them directly onto the canvas.
  - **Smart Snapping**: Auto-alignment to grid and other components for precise layouts.
- **🔗 Intelligent Connection Routing**:
  - **Auto-Route**: Algorithms to automatically calculate orthogonal paths between ports, avoiding obstacles.
  - **Manual Routing**: Full control over connection paths with waypoint support.
- **📦 Component Models**: Support for complex components with defined Input/Output ports, physical dimensions, and metadata.
- **Export & Integration**:
  - **UPH Export**: One-click export of project data (BOM and Design files) to the Unified Project Hub.
  - **Image Export**: High-resolution PNG export for documentation.

## 🛠️ Technology Stack

- **Runtime**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Canvas Engine**: Custom SVG React Renderer
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **pnpm**

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd Weave-main
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run in Development Mode:**
    Start the Vite dev server and Electron wrapper simultaneously:

    ```bash
    pnpm electron:dev
    ```

4.  **Build for Production:**
    Create a distributable installer (exe/dmg):
    ```bash
    pnpm electron:build
    ```

## 📂 Project Structure

```
Weave-main/
├── components/          # React Components
│   ├── canvas/          # Canvas specific nodes (ProductNode, ConnectionLine)
│   ├── layout/          # App Shell (LeftSidebar, Toolbar)
│   ├── modals/          # Dialogs (Settings, Export)
│   └── Canvas.tsx       # Main Canvas Engine & Event Handlers
├── electron/            # Electron Main Process code
├── hooks/               # Custom React Hooks (useHistory, useCanvasView)
├── services/            # Core Logic (Pathfinding, Analyzers)
├── types/               # TypeScript Interfaces
├── utils/               # Geometry & Helper functions
└── App.tsx              # Application Entry Point
```

## 🎮 Controls

- **Pan**: Middle Mouse Button (Drag) or Space + Drag
- **Zoom**: Mouse Wheel
- **Select**: Left Click
- **Multi-Select**: Shift + Click or Drag Selection Box
- **ContextMenu**: Right Click on items
- **Drag & Drop**: Drag items from the Left Sidebar onto the Canvas.

## 🤝 Integration with UPH

Weave is designed to work hand-in-hand with UPH. Use the **"UPH'a Gönder"** button in the top toolbar to sync your current design's Bill of Materials and snapshot directly to a specific UPH project.

## 📄 License

This project is licensed under the MIT License.
