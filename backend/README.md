# PradhanFresh Backend

Backend API for PradhanFresh - Fresh fruits and vegetables delivery platform.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/pradhanfresh
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

### Base URL
- Development: `http://localhost:5000`

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | Health check |
| GET | `/api/products` | Get all products (placeholder) |
| GET | `/api/users` | Get all users (placeholder) |

## Features

- ✅ Express.js server setup
- ✅ CORS enabled
- ✅ JSON parsing middleware
- ✅ Basic error handling
- ✅ Health check endpoint
- 🚧 Authentication (planned)
- 🚧 Database integration (planned)
- 🚧 Product management (planned)
- 🚧 Order management (planned)

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB (planned)
- **Authentication**: JWT
- **File Upload**: Multer
- **Development**: Nodemon

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── db.json            # Mock data (temporary)
└── README.md          # This file
``` 