# 🥬 PradhanFresh

A modern fresh fruits and vegetables delivery platform built with React, TypeScript, and Express.js.

## 📋 Project Overview

PradhanFresh is a comprehensive e-commerce platform designed for delivering fresh fruits and vegetables. The project features a modern React frontend with TypeScript and a robust Express.js backend API.

## 🏗️ Project Structure

```
pradhanfresh/
├── 📁 backend/              # Express.js API server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── db.json            # Mock data
│   └── README.md          # Backend documentation
├── 📁 frontend/             # React + TypeScript + Vite
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── README.md          # Frontend documentation
├── README.md               # This file
└── Roadmap.md             # Development roadmap
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pradhanfresh
```

### 2. Setup Backend
```bash
cd backend
npm install
npm run dev
```
Backend will run on `http://localhost:5000`

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting and formatting

### Backend
- **Express.js** - Web framework for Node.js
- **Node.js** - JavaScript runtime
- **MongoDB** - Database (planned)
- **JWT** - Authentication (planned)
- **Multer** - File upload handling (planned)

## 📱 Features

### Current Features ✅
- Modern responsive UI design
- Product catalog display
- Navigation and routing
- Admin dashboard structure
- Contact and about pages
- RESTful API endpoints
- Health check monitoring

### Planned Features 🚧
- User authentication and registration
- Shopping cart functionality
- Order management system
- Payment gateway integration
- Real-time inventory management
- Product search and filtering
- User reviews and ratings
- Admin panel for product management

## 📖 Documentation

- [Frontend Documentation](./frontend/README.md) - React app setup and components
- [Backend Documentation](./backend/README.md) - API endpoints and server setup
- [Project Roadmap](./Roadmap.md) - Development phases and milestones

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev    # Start development server with nodemon
npm start      # Start production server
npm test       # Run tests (when available)
```

### Frontend Development
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | Health check |
| GET | `/api/products` | Get all products |
| GET | `/api/users` | Get all users |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

For any questions or suggestions, please feel free to reach out!

---

**Happy Coding! 🚀**
