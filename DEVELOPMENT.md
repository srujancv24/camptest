# Development Guide

This guide will help you get started with developing the Camp Test application.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install separately:
npm run install:frontend  # Install React/Vite dependencies
npm run install:backend   # Install Python dependencies
```

### 2. Start Development Servers
```bash
# Start both frontend and backend servers
npm run dev

# Or start them separately:
npm run dev:frontend  # React dev server (http://localhost:5173)
npm run dev:backend   # FastAPI server (http://localhost:8000)
```

### 3. Verify Setup
```bash
# Run the setup verification script
python3 test_setup.py
```

## 🏗️ Project Architecture

### Backend (Python/FastAPI)
- **Location**: `backend/`
- **Main file**: `backend/main.py`
- **Dependencies**: `backend/requirements.txt`
- **Port**: 8000

The backend provides a REST API for campsite data using the `camply` library.

#### Key API Endpoints:
- `GET /` - Health check
- `GET /api/health` - Detailed health check
- `GET /api/recreation-areas` - List available recreation areas
- `POST /api/search` - Search for campsites

### Frontend (React/Vite)
- **Location**: `frontend/`
- **Main file**: `frontend/src/App.jsx`
- **Dependencies**: `frontend/package.json`
- **Port**: 5173

The frontend provides a modern web interface for searching and viewing campsites.

## 🔧 Development Workflow

### Adding New Features

1. **Backend Changes**:
   - Add new API endpoints in `backend/main.py`
   - Update Pydantic models for request/response validation
   - Test endpoints using the FastAPI automatic docs at `http://localhost:8000/docs`

2. **Frontend Changes**:
   - Add new React components in `frontend/src/`
   - Update the main App component to integrate new features
   - Style components using CSS modules or the existing CSS

### Testing

```bash
# Test frontend
npm run test:frontend

# Test backend (manual testing via API docs)
# Visit http://localhost:8000/docs when backend is running

# Run setup verification
python3 test_setup.py
```

### Building for Production

```bash
# Build frontend for production
npm run build

# The built files will be in frontend/dist/
```

## 🛠️ VS Code Integration

The project includes VS Code configuration for optimal development experience:

### Available Tasks (Ctrl/Cmd + Shift + P → "Tasks: Run Task"):
- **Start Development Servers** - Start both frontend and backend
- **Start Frontend Only** - Start only React dev server
- **Start Backend Only** - Start only FastAPI server
- **Install All Dependencies** - Install both frontend and backend deps
- **Build Frontend** - Build React app for production

### Debug Configuration:
- **Python: FastAPI Backend** - Debug the FastAPI server
- **Python: FastAPI with Uvicorn** - Debug with Uvicorn directly

## 📚 Key Libraries and Tools

### Backend
- **FastAPI** - Modern Python web framework
- **camply** - Campsite availability checking
- **uvicorn** - ASGI server for FastAPI
- **pydantic** - Data validation and serialization

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Modern JavaScript/ES6+**

### Development Tools
- **concurrently** - Run multiple npm scripts simultaneously
- **VS Code** - Recommended IDE with configured tasks and debugging

## 🔍 Troubleshooting

### Common Issues

1. **"python command not found"**
   - Use `python3` instead of `python`
   - Ensure Python 3.8+ is installed

2. **Backend dependencies not found**
   - Run `pip3 install -r backend/requirements.txt`
   - Consider using a virtual environment

3. **Frontend won't start**
   - Ensure Node.js 16+ is installed
   - Run `npm run install:frontend`
   - Clear cache: `npm cache clean --force`

4. **CORS errors**
   - Ensure backend is running on port 8000
   - Check CORS configuration in `backend/main.py`

### Getting Help

1. Check the main [README.md](README.md) for setup instructions
2. Review the [GitHub Copilot instructions](.github/copilot-instructions.md)
3. Run the test script: `python3 test_setup.py`
4. Check the FastAPI docs at `http://localhost:8000/docs`

## 🎯 Next Steps

1. **Integrate Real Camply Data**: Replace mock data with actual camply library calls
2. **Add More Recreation Areas**: Expand the list of searchable areas
3. **Improve UI/UX**: Add loading states, better error handling, and responsive design
4. **Add Filtering**: Allow users to filter results by amenities, availability, etc.
5. **Add Notifications**: Implement campsite availability alerts
6. **Add Maps**: Integrate with mapping services to show campsite locations

## 📝 Contributing

1. Follow the coding standards outlined in `.github/copilot-instructions.md`
2. Test your changes thoroughly
3. Update documentation as needed
4. Submit pull requests with clear descriptions

Happy camping! 🏕️