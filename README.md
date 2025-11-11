# Wallet App - Frontend

Minimal React frontend for the Mini Blockchain Wallet Application.

## Features

- User authentication (login/register)
- Wallet creation
- Send funds
- Transaction history
- Balance checking

## Tech Stack

- React + TypeScript
- Vite (build tool)
- Apollo Client (GraphQL)
- Chakra UI (components)
- React Router (routing)
- React Hook Form (form handling)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create `.env` file:
```
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # Apollo Client setup
├── hooks/          # Custom React hooks
├── theme.ts        # Chakra UI theme
└── App.tsx         # Main app component
```

