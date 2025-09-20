# Timesheet System Frontend

React PWA frontend for the Timesheet System.

## Development Setup

### Environment Configuration

The frontend can be configured for different environments:

#### Production Environment (Firebase)
- Uses `frontend/.env.production`
- API Base URL: `https://timesheet.aerocars.cc/api/v1`
- Deployed to: `https://timesheet-5fff2.web.app`

#### Local Development Environment
- Uses `frontend/.env.local` (create this file locally)
- Should point to production API for development
- This file is ignored by Git

Create `frontend/.env.local` for local development:
```env
# Use production API for local development
VITE_API_BASE_URL=https://timesheet.aerocars.cc/api/v1
VITE_APP_TITLE=Timesheet System (Dev)
VITE_APP_VERSION=1.0.0-dev
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
./deploy.sh
```

### API Connection

The frontend automatically connects to:
- **Local Development**: Production API (via `.env.local`)
- **Production Build**: Production API (via `.env.production`)

This setup allows for local frontend development without running a local backend.

### Test Accounts

Use these accounts for testing:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | password123 | Super Admin |
| companyadmin@example.com | password123 | Company Admin |
| user@example.com | password123 | Employee |

### Troubleshooting

#### Login Error: "ERR_CONNECTION_REFUSED"
- **Cause**: Missing `.env.local` file in development
- **Solution**: Create `frontend/.env.local` with production API URL

#### CORS Error: "blocked by CORS policy"
- **Cause**: Production API CORS policy restricts origins
- **Fixed**: Backend nginx configuration supports localhost origins for development
- **Supported Origins**: `https://timesheet-5fff2.web.app`, `http://localhost:*`, `http://127.0.0.1:*`

#### Dark Input Backgrounds on Mobile
- **Fixed**: Added CSS overrides in `src/index.css`
- **Includes**: iOS Safari fixes and autofill styling

#### Login Error: "Bad Request"
- **Common Cause**: Incorrect password
- **Correct Password**: `password123` (not `password`)
- **Test Accounts**: Use emails from the test accounts table above

### Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (UserContext)
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── main.tsx       # App entry point
├── public/            # Static assets
├── .env.production    # Production environment (committed)
├── .env.local         # Local development (not committed)
└── deploy.sh          # Deployment script
```

### Technologies Used

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Axios** for API calls
- **React Router** for navigation
- **Firebase Hosting** for deployment
- **PWA** capabilities via vite-plugin-pwa

## React + TypeScript + Vite Configuration

If you are developing a production application, we recommend updating the ESLint configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
