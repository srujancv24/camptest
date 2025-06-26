# Camp Test - Campsite Availability Checker

A full-stack application for checking campsite availability using the [camply](https://github.com/juftin/camply) library with a Python FastAPI backend and React frontend.

## 🏕️ Features

- **Real-time Campsite Search**: Search for available campsites across various recreation areas
- **Modern Web Interface**: Clean, responsive React frontend
- **Fast API Backend**: Python FastAPI server with camply integration
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🏗️ Project Structure

```
Camp_Test/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/               # React frontend (Vite)
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── package.json           # Root package.json with workspace scripts
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot guidelines
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **npm** or **yarn** (package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Camp_Test
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Install frontend dependencies
   npm run install:frontend
   
   # Install backend dependencies (requires Python)
   npm run install:backend
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

### Development

**Start both frontend and backend:**
```bash
npm run dev
```

**Or start them separately:**
```bash
# Start frontend only (http://localhost:5173)
npm run dev:frontend

# Start backend only (http://localhost:8000)
npm run dev:backend
```

### Building for Production

```bash
npm run build
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the React frontend |
| `npm run dev:backend` | Start only the Python backend |
| `npm run build` | Build frontend for production |
| `npm run install:all` | Install all dependencies (frontend + backend) |
| `npm run install:frontend` | Install frontend dependencies |
| `npm run install:backend` | Install backend dependencies |
| `npm run test` | Run frontend tests |
| `npm run lint` | Run frontend linting |

## 🌐 API Endpoints

The backend provides the following API endpoints:

- `GET /` - Health check
- `GET /api/health` - Detailed health check
- `POST /api/search` - Search for available campsites
- `GET /api/recreation-areas` - Get list of recreation areas
- `POST /api/rec-areas` - Search for recreation areas by name/state
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)
- `GET /api/dashboard/stats` - Public dashboard statistics
- `GET /api/campgrounds/{campground_id}/availability` - Get availability for a campground
- `POST /api/campgrounds/{campground_id}/availability` - Check availability (with body)
- `POST /api/campgrounds/{campground_id}/alerts` - Create an alert (requires auth)
- `GET /api/campgrounds/alerts` - Get all alerts for current user (requires auth)
- `PATCH /api/campgrounds/alerts/{alert_id}` - Update an alert (requires auth)
- `DELETE /api/campgrounds/alerts/{alert_id}` - Delete an alert (requires auth)

### Example API Usage

```bash
# Health check
curl http://localhost:8000/api/health

# Search campsites
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "recreation_area": "yosemite",
    "start_date": "2024-07-01",
    "end_date": "2024-07-03",
    "nights": 2
  }'
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **camply** - Campsite availability checking library
- **uvicorn** - ASGI server
- **Pydantic** - Data validation

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Modern JavaScript/ES6+**

## 📝 Development Guidelines

### Backend Development
- Follow PEP 8 Python style guidelines
- Use async/await for I/O operations
- Implement proper error handling and logging
- Use Pydantic models for request/response validation

### Frontend Development
- Use modern React patterns (hooks, functional components)
- Implement responsive design
- Handle loading states and errors gracefully
- Follow component-based architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [camply](https://github.com/juftin/camply) - The awesome library that powers our campsite search
- [campscout](https://github.com/srujancv24/campscout) - Inspiration for the frontend architecture

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Ensure Python 3.8+ is installed
   - Check that all Python dependencies are installed: `pip install -r backend/requirements.txt`

2. **Frontend won't start**
   - Ensure Node.js 16+ is installed
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf frontend/node_modules && npm run install:frontend`

3. **CORS errors**
   - Ensure the backend is running on port 8000
   - Check that CORS is properly configured in `backend/main.py`

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Create a new issue if you encounter a bug
- Review the [GitHub Copilot instructions](.github/copilot-instructions.md) for development guidelines