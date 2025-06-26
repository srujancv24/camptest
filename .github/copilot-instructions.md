# GitHub Copilot Instructions for Camp Test Project

## Project Overview
This is a campsite availability checker application with:
- **Backend**: Python FastAPI server using the `camply` library for campsite data
- **Frontend**: React application built with Vite
- **Architecture**: Monorepo with clear separation between frontend and backend

## Project Structure
```
Camp_Test/
├── backend/           # Python FastAPI backend
│   ├── main.py       # Main FastAPI application
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React frontend (Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── package.json      # Root package.json with workspace scripts
└── README.md
```

## Development Guidelines

### Backend (Python/FastAPI)
- Use FastAPI for API endpoints
- Integrate with `camply` library for campsite data
- Follow REST API conventions
- Use Pydantic models for request/response validation
- Enable CORS for frontend communication
- Use async/await patterns where appropriate
- Log important operations and errors

### Frontend (React/Vite)
- Use modern React with hooks
- Follow component-based architecture
- Use TypeScript when possible
- Implement responsive design
- Handle API errors gracefully
- Use proper state management (Context API or external library)

### Code Style
- **Python**: Follow PEP 8 conventions
- **JavaScript/React**: Use ESLint and Prettier configurations
- Use meaningful variable and function names
- Add comments for complex logic
- Write self-documenting code

### API Integration
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:5173`
- API endpoints should be prefixed with `/api/`
- Use proper HTTP status codes
- Implement proper error handling

### Common Patterns
- Use environment variables for configuration
- Implement proper logging
- Handle async operations properly
- Use proper error boundaries in React
- Implement loading states for API calls

### Testing
- Write unit tests for utility functions
- Test API endpoints
- Test React components
- Use appropriate testing libraries (pytest for Python, Jest/React Testing Library for React)

### Dependencies
- Keep dependencies up to date
- Use specific versions in requirements.txt
- Document any special setup requirements

## Helpful Commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend for production

## Key Libraries
- **Backend**: FastAPI, camply, uvicorn, pydantic
- **Frontend**: React, Vite, (add others as needed)

When suggesting code, prioritize:
1. Security best practices
2. Performance optimization
3. Code maintainability
4. User experience
5. Error handling