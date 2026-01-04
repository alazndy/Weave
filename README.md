# Weave: Schematic Design & Engineering Canvas

![Status](https://img.shields.io/badge/Status-Alpha-rose) ![License](https://img.shields.io/badge/License-MIT-green) ![Tech](https://img.shields.io/badge/Tech-React%2019%20%7C%20Vite%20%7C%20Canvas-FF6B6B)

**Weave** is the premier engineering design tool of the **T-Ecosystem**. It provides an infinite, high-performance vector canvas for creating complex schematics, wiring diagrams, and process flows. Uniquely, Weave is deeply integrated with the ecosystem's data, allowing you to drag live inventory items directly into your technical drawings.

## 🚀 Capabilities & Features

### 🎨 Infinite Engineering Canvas

- **Vector Engine**: Zoom from 10% to 5000% without loss of fidelity.
- **Layer Management**: Complex designs organized into selectable, lockable layers.
- **Smart Connectors**: Auto-routing wires that snap to component ports and maintain connections during movement.

### 🔌 Ecosystem Integration

- **Live Inventory Sync (ENV-I)**: Drag a product from the sidebar, and it links to the real SKUs in your database.
- **Stock Awareness**: Real-time stock level indicators directly on schematic components.
- **BOM Generation**: One-click export of a Bill of Materials based on the components placed on the canvas.

### 🛠️ Professional Design Tools

- **Component Library**: Extensive library of electrical, mechanical, and flow symbols.
- **Custom Parts**: Create and save your own composable logic blocks.
- **Grid & Snapping**: Precision alignment tools for professional layouts.
- **History API**: Robust Undo/Redo (Ctrl+Z/Ctrl+Y) functionality tracking every move.

### ☁️ Cloud & Collaboration

- **Cloud Sync**: Designs are automatically saved to the ecosystem cloud.
- **Version Control**: Save named snapshots and restore previous versions of your design.
- **PDF Export**: High-resolution export for printing and technical documentation bundles.

## 🛠️ Technology Architecture

- **Core**: **React 19** + **Vite** for blazing fast performance.
- **Canvas Engine**: Custom HTML5 Canvas implementation (referencing Fabric.js concepts) for maximum control.
- **State Management**: **Zustand** + **Immer** for complex immutable state updates.
- **Styling**: Tailwind CSS + Shadcn UI.
- **Sync**: Custom hooks (`useEnviStock`, `useCloudSync`) connecting to Firebase.

## 📂 Project Structure

```bash
src/
├── components/
│   ├── canvas/      # The core drawing engine
│   ├── library/     # Component browser (ENV-I linked)
│   └── ui/          # Toolbars and panels
├── hooks/
│   ├── useCanvas.ts # Main canvas logic
│   └── useHistory.ts# Undo/Redo implementation
├── services/        # Backend sync & asset loading
└── types/           # Schematic data models (Node, Edge, Port)
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/alazndy/Weave.git
    cd Weave
    ```

2.  **Install Dependencies**

    ```bash
    pnpm install
    ```

3.  **Run Development Server**

    ```bash
    pnpm dev
    ```

    Open [http://localhost:3004](http://localhost:3004) to start designing.

---

Part of the **T-Ecosystem**.
