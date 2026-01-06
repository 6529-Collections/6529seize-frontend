# Technology Stack

## Core Frontend
- **Language:** TypeScript
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19

## Styling
- **Tailwind CSS:** Preferred for all new development and migration targets.
- **Legacy Styling:** SCSS/CSS modules are present in the codebase but are being phased out.

## State Management
- **Context API:** Primary method for state management across the application.
- **Redux Toolkit:** Configured in the project but usage is minimal/legacy; not preferred for new features.

## Data Fetching & Web3
- **TanStack Query (React Query):** For server state and caching.
- **Wagmi & Viem:** For Ethereum blockchain interactions.
- **Axios:** For general API requests.

## Testing & Quality
- **Jest:** Unit and integration testing.
- **Playwright:** End-to-end testing.

## Observability & Tools
- **AWS RUM:** For real-user monitoring and performance tracking.
- **Sentry:** For error tracking and monitoring.
- **OpenAPI Generator:** For generating API clients and models.
- **Capacitor:** For cross-platform mobile support.
