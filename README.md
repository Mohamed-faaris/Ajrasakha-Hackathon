# Ajrasakha Hackathon
https://vicharanashala.github.io/ajrasakha-hackathon/docs/problem-statements/pb1/

A full-stack application with a React frontend and Node.js/Express server using TypeScript, MongoDB, and authentication.

## Project Structure

```text
frontend/  # React + Vite UI
server/    # Node.js + Express backend
shared/    # Shared types/utilities
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

Install all dependencies:

```bash
pnpm install
```

Or install separately:

```bash
pnpm run install:frontend
pnpm run install:server
```

## Development

Start frontend + server:

```bash
pnpm run dev
```

Run only one service:

```bash
pnpm run dev:frontend
pnpm run dev:server
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

## Environment Variables

Server (`server/.env`):

```env
PORT=5000
MONGO_URI=mongodb://admin:password@localhost:27017/ajrasakha
JWT_SECRET=your_jwt_secret_here
```

Frontend: no required env vars for basic setup.

## Scripts

- `pnpm run install`
- `pnpm run install:frontend`
- `pnpm run install:server`
- `pnpm run dev`
- `pnpm run dev:frontend`
- `pnpm run dev:server`
- `pnpm run build`
- `pnpm run build:frontend`
- `pnpm run build:server`
- `pnpm run test:frontend`
- `pnpm run test:frontend:watch`
- `pnpm run start:server`
- `pnpm run prod`

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
