# Server

Node.js/Express backend for Ajrasakha Hackathon.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm run dev
```

## Production

```bash
pnpm run build
pnpm start
```

## Environment

Create `.env` file with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ajrasakha
JWT_SECRET=your_jwt_secret_here
```

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
