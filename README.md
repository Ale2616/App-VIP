# AppCatalog - Platform

A web application catalog for downloading apps and games, built with Next.js and Express.

## Features

- **User Authentication**: Login/Register with JWT
- **Role-based Access**: Admin and User roles
- **Admin Dashboard**: Manage apps, upload images, track downloads
- **Public Catalog**: Browse apps by category, view details, download
- **Visit & Download Tracking**: Global visit counter and per-app download counter
- **Categories**: Games, Applications, Most Popular, Most Downloaded, All

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- TypeScript
- React Query (TanStack Query)
- Zustand (State Management)
- Framer Motion (Animations)
- shadcn/ui (UI Components)
- Tailwind CSS
- Zod + React Hook Form (Validation)
- Sonner (Toasts)
- Axios (HTTP Client)

### Backend
- Express.js
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Cloudinary (Image Storage)
- Multer (File Upload)
- Zod (Validation)

## Setup

### Prerequisites
- Node.js
- PostgreSQL
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database and Cloudinary credentials:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/appcatalog
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Start the server:
```bash
npm run dev
```

6. Seed the admin user (first time only):
```bash
npm run seed:admin
```

Default admin credentials:
- Email: `admin@devcorex.com`
- Password: `admin123`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. The `.env.local` file is already configured. Update if needed:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Apps
- `GET /api/apps` - Get all apps
- `GET /api/apps?category=slug` - Filter by category
- `GET /api/apps?mostDownloaded=true` - Get most downloaded apps
- `GET /api/apps/:id` - Get app by ID
- `POST /api/apps` - Create app (admin only)
- `PUT /api/apps/:id` - Update app (admin only)
- `DELETE /api/apps/:id` - Delete app (admin only)
- `POST /api/apps/:id/download` - Track download
- `POST /api/apps/upload` - Upload image (admin only)

### Categories
- `GET /api/categories` - Get all categories

### Visits
- `POST /api/visits/track` - Track a visit
- `GET /api/visits/count` - Get total visit count

## Project Structure

```
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API client, utilities
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── .env.local
│
└── server/                # Express backend
    ├── src/
    │   ├── config/        # Environment config
    │   ├── controllers/   # Request handlers
    │   ├── database/      # TypeORM, migrations, seeds
    │   ├── entities/      # TypeORM entities
    │   ├── middlewares/   # Auth, upload middleware
    │   ├── repositories/  # Data access layer
    │   ├── routes/        # API routes
    │   ├── schemas/       # Zod validation schemas
    │   ├── services/      # Business logic
    │   ├── types/         # TypeScript types
    │   └── utils/         # Utilities (JWT)
    └── .env
```

## Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed:admin` - Seed admin user

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
