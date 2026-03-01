# Ajrasakha Hackathon
https://vicharanashala.github.io/ajrasakha-hackathon/docs/problem-statements/pb1/

A full-stack application with a React frontend and Node.js/Express server using TypeScript, MongoDB, and authentication.

## Project Structure

```
├── frontend/        # React + Vite frontend
├── server/          # Node.js + Express backend
├── shared/          # Shared types/utilities
└── README.md        # This file
```

## Prerequisites

- Node.js (v18+)
- pnpm (`npm install -g pnpm`)
- MongoDB

### MongoDB Setup with Docker

```bash
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

Stop: `docker stop mongodb`  
Start: `docker start mongodb`  
Remove: `docker rm mongodb`

Example connection string:

- `mongodb://admin:password@localhost:27017/ajrasakha`

## Installation

Install dependencies for both frontend and server:

```bash
pnpm install
```

Or install separately:

```bash
pnpm run install:frontend  # Install frontend dependencies
pnpm run install:server  # Install server dependencies
```

## Development

Start both frontend and server in development mode:

```bash
pnpm run dev
```

This runs the frontend on `http://localhost:5173` and server on `http://localhost:5000`.

Or run separately:

```bash
pnpm run dev:frontend  # Start frontend only
pnpm run dev:server  # Start server only
```

## Testing

Run frontend tests:

```bash
pnpm run test:frontend
```

Watch mode:

```bash
pnpm run test:frontend:watch
```

## Production

```bash
pnpm run prod
```

This builds both frontend and server, then starts the server.

## Environment Variables

Server (`server/.env`):

```env
PORT=5000
MONGO_URI=mongodb://admin:password@localhost:27017/ajrasakha
JWT_SECRET=your_jwt_secret_here
```

Frontend: no required env vars for basic setup.

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (requires Bearer token)

## Scripts

- `pnpm run install` - Install all dependencies
- `pnpm run dev` - Start development servers
- `pnpm run build` - Build for production
- `pnpm run prod` - Build and start production server
- `pnpm run dev:frontend` - Start frontend dev server
- `pnpm run dev:server` - Start server dev server
- `pnpm run build:frontend` - Build frontend
- `pnpm run build:server` - Build server
- `pnpm run start:server` - Start production server

## Technologies

### Frontend

- React
- TypeScript
- Vite
- Vitest

### Server

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication

## License

MIT
