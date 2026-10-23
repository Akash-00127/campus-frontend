# Campus Drop admin

Next.js + TypeScript operations console for the shared NestJS API. Copy .env.example to .env.local and set BACKEND_URL if needed. Run npm ci, npm run dev. Production: npm run build then npm start.

Sign in with the backend administrator account. Authentication uses an HTTP-only same-site cookie. Pages and mutations call the backend server-side; the backend independently enforces roles.

Includes university/campus creation and activation, campus COD fees, vendor creation/approval, student verification/suspension, category/product oversight, order timelines, support, content settings, operational totals and audit history. Archive/deactivate records to preserve financial history.

See ../campus backend/README.md for the local owner credential-file location, shared setup and remaining production work. Do not publish local credentials or the development database.
