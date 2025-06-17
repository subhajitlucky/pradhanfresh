# PradhanFresh Frontend

Frontend application for PradhanFresh - Fresh fruits and vegetables delivery platform built with React, TypeScript, and Vite.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ Tailwind CSS for styling
- ✅ ESLint for code quality
- ✅ Responsive design
- ✅ Component-based architecture
- ✅ Modern UI components
- 🚧 Shopping cart (planned)
- 🚧 User authentication UI (planned)
- 🚧 Payment integration (planned)

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Linting**: ESLint
- **Package Manager**: npm

## Project Structure

```
frontend/
├── public/             # Static assets
│   └── vite.svg
├── src/
│   ├── assets/         # Images and other assets
│   │   ├── images/     # Product and UI images
│   │   └── react.svg
│   ├── components/     # Reusable components
│   │   ├── Login.tsx
│   │   └── Navbar.tsx
│   ├── pages/          # Page components
│   │   ├── About.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── Contact.tsx
│   │   ├── Home.tsx
│   │   └── Products.tsx
│   ├── App.tsx         # Main app component
│   ├── App.css         # App-specific styles
│   ├── index.css       # Global styles
│   ├── main.tsx        # Entry point
│   └── vite-env.d.ts   # Vite type definitions
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Development Server

The development server runs on `http://localhost:5173`

## Pages

- **Home** (`/`) - Landing page with featured products
- **Products** (`/products`) - Product catalog
- **About** (`/about`) - About the company
- **Contact** (`/contact`) - Contact information
- **Admin Dashboard** (`/admin`) - Admin panel (authentication required) 