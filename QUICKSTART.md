# Quick Start Guide - Wallet App (Frontend)

Get the wallet app frontend up and running in 3 steps!

## Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **Backend Service Running**
   - Make sure `wallet-service` is running on `http://localhost:4000`
   - See `wallet-service/QUICKSTART.md` for backend setup

## Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
cd wallet-app
npm install
```

### Step 2: Create Environment File

Create a `.env` file in the `wallet-app` directory:

```bash
cd wallet-app
touch .env
```

Add the following content:

```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

**Note:** If your backend is running on a different port or URL, update this accordingly.

### Step 3: Start Development Server

```bash
npm run dev
```

The app will start on `http://localhost:5173` (Vite's default port).

## Verify It's Working

1. Open your browser to `http://localhost:5173`
2. You should see the login/register page
3. Try registering a new user:
   - Email: `test@example.com`
   - Password: `Test123!@#`

## Troubleshooting

### Backend Not Running
- **Error:** "Failed to fetch" or network errors
- **Solution:** Make sure `wallet-service` is running on port 4000
  ```bash
  cd wallet-service
  npm run dev
  ```

### Port Already in Use
- **Error:** Port 5173 is already in use
- **Solution:** Vite will automatically use the next available port, or you can specify one:
  ```bash
  npm run dev -- --port 3000
  ```

### CORS Errors
- **Error:** CORS policy blocking requests
- **Solution:** Make sure `CORS_ORIGIN` in `wallet-service/.env` includes your frontend URL:
  ```env
  CORS_ORIGIN=http://localhost:5173
  ```

### GraphQL Connection Issues
- **Error:** Cannot connect to GraphQL endpoint
- **Solution:** 
  1. Verify `VITE_GRAPHQL_URL` in `.env` is correct
  2. Check backend is running: `curl http://localhost:4000/health`
  3. Test GraphQL endpoint: `curl http://localhost:4000/graphql`

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
wallet-app/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.tsx
│   │   └── PrivateRoute.tsx
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CreateWalletPage.tsx
│   │   ├── SendFundsPage.tsx
│   │   └── TransactionHistoryPage.tsx
│   ├── services/        # Apollo Client setup
│   │   └── apolloClient.ts
│   ├── hooks/          # Custom React hooks
│   │   └── useAuth.ts
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── theme.ts        # Chakra UI theme
├── .env                # Environment variables
└── package.json
```

## Next Steps

- Read the [Backend API Documentation](../wallet-service/docs/API.md) for available GraphQL operations
- Check [Backend README](../wallet-service/README.md) for backend setup
- View the app at `http://localhost:5173`

