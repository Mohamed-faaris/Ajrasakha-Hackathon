# Ajrasakha Hackathon
https://vicharanashala.github.io/ajrasakha-hackathon/docs/problem-statements/pb1/
A full-stack application with React client and Node.js/Express server using TypeScript, MongoDB, and authentication.

## Project Structure

```
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── shared/          # Shared types/utilities
└── README.md        # This file
```

## Prerequisites

- Node.js (v18+)
- pnpm (install with `npm install -g pnpm`)
- MongoDB

### MongoDB Setup with Docker

Run MongoDB in a Docker container with authentication:

```bash
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

To stop: `docker stop mongodb`

To start again: `docker start mongodb`

To remove: `docker rm mongodb`

### Example Connection Strings

- With authentication: `mongodb://admin:password@localhost:27017/ajrasakha`

## Installation

Install dependencies for both client and server:

```bash
pnpm install
```

Or install separately:

```bash
pnpm run install:client  # Install client dependencies
pnpm run install:server  # Install server dependencies
```

## Development

Start both client and server in development mode:

```bash
pnpm run dev
```

This runs the client on `http://localhost:5173` and server on `http://localhost:5000`.

Or run separately:

```bash
pnpm run dev:client  # Start client only
pnpm run dev:server  # Start server only
```

## Production

Build and start the application:

```bash
pnpm run prod
```

This builds both client and server, then starts the server.

## Environment Variables

### Server (.env)

Copy `.env.example` to `.env` and update the values:

```env
PORT=5000
MONGO_URI=mongodb://admin:password@localhost:27017/ajrasakha
JWT_SECRET=your_jwt_secret_here
```

### Client

No environment variables required for basic setup.

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (requires Bearer token)

## Scripts

- `pnpm run install` - Install all dependencies
- `pnpm run dev` - Start development servers
- `pnpm run build` - Build for production
- `pnpm run prod` - Build and start production server
- `pnpm run dev:client` - Start client dev server
- `pnpm run dev:server` - Start server dev server
- `pnpm run build:client` - Build client
- `pnpm run build:server` - Build server
- `pnpm run start:server` - Start production server

## Technologies

### Client

- React 19
- TypeScript
- Vite
- ESLint

### Server

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Zod for env validation

## License

MIT
