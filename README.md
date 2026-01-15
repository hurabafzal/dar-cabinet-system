# DAR Platform

A modern 3D furniture configuration and room planning application.

## Overview

DAR Platform is a web and mobile application that allows users to design and configure custom furniture arrangements in a virtual 3D environment. Users can place cabinet models in a virtual room, customize their dimensions, materials, and finishes, and generate a complete order summary.

## Features

- Interactive 3D room environment
- Drag-and-drop furniture placement with intelligent snapping
- Real-time material and texture customization
- Dynamic pricing calculations
- Multi-language support (English and Arabic)
- Responsive design for both desktop and mobile devices
- Order summary and checkout process

## Technology Stack

- **Frontend**: React, TypeScript
- **3D Rendering**: Three.js, React Three Fiber
- **State Management**: Custom store implementation
- **Build Tool**: Vite
- **Mobile Support**: Capacitor
- **3D Models**: GLB format managed with Git LFS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git LFS (for handling 3D model files)

### Installation

1. Clone the repository
```bash
git clone https://github.com/DARIT-DEV/dar-platform.git
cd dar-platform
```

2. Install Git LFS and pull LFS objects
```bash
git lfs install
git lfs pull
```

3. Install dependencies
```bash
npm install
# or 
yarn install
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running on Mobile

#### Development Mode with Live-Reload

For testing with live-reload on device:

```bash
# Set environment variable (Unix/Mac)
export NODE_ENV=development
# Or on Windows
# set NODE_ENV=development

# Sync and open iOS
npx cap sync ios
npx cap open ios
```

#### Production Mode

For a final production build:

```bash
# Create build
npm run build
# Or with yarn
# yarn build

# Set production mode
export NODE_ENV=production
# Or on Windows
# set NODE_ENV=production

# Sync and open iOS
npx cap sync ios
npx cap open ios
```

For first-time setup:
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Project Structure

```
dar-platform/
├── dist/                  # Build output
├── ios/                   # iOS platform files
├── node_modules/          # Dependencies
├── public/                # Static assets
├── src/                   # Source code
│   ├── api/               # API calls
│   ├── components/        # React components
│   ├── config/            # Configuration files
│   ├── helpers/           # Helper functions
│   ├── models/            # 3D models
│   ├── store/             # State management
│   └── utils/             # Utility functions
├── .gitattributes         # Git attributes
├── .gitignore             # Git ignore rules
├── capacitor.config.ts    # Capacitor configuration
├── index.html             # Entry HTML file
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## Key Components

- **Configurator**: Main component for configuring furniture items
- **Sidebar**: Contains draggable cabinet models
- **Movable**: Handles 3D object movement and placement
- **Terms**: Order summary and checkout page

## Development Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Test on both desktop and mobile viewports
- Ensure compatibility with both English and Arabic languages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All rights reserved

## Contact

DAR IT Development Team - [it@dar-kuwait.com](mailto:it@dar-kuwait.com)

Project Link: [https://github.com/DARIT-DEV/dar-platform](https://github.com/DARIT-DEV/dar-platform)