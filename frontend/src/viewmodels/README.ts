/**
 * MVVM Architecture Guide for Codenium
 * 
 * This project follows the Model-View-ViewModel (MVVM) pattern:
 * 
 * 1. MODEL (src/infrastructure/, src/models/)
 *    - Data sources: MongoDB, PostgreSQL, Local Files
 *    - Services: MongoDBService, GeoLocationService, LocalFileSyncService
 *    - Types: ProblemData, UserProgress, ActivityEvent
 *    - API clients: PlaygroundAPI, etc.
 * 
 * 2. VIEW (frontend/src/components/, frontend/src/pages/)
 *    - Pure React components that render UI
 *    - Should NOT contain business logic
 *    - Only responsible for:
 *      - Rendering based on props
 *      - Dispatching user actions to ViewModel
 *      - Displaying loading/error states
 * 
 * 3. VIEWMODEL (frontend/src/viewmodels/)
 *    - Custom React hooks that manage state and business logic
 *    - Bridge between Model and View
 *    - Responsibilities:
 *      - Fetch data from APIs/services
 *      - Transform data for display
 *      - Handle user actions
 *      - Manage loading/error states
 * 
 * Example Structure:
 * 
 * ```
 * frontend/src/
 * ├── components/         # VIEW - Pure UI components
 * │   ├── ProblemCard.tsx
 * │   └── SolutionModal.tsx
 * │
 * ├── viewmodels/         # VIEWMODEL - State & logic hooks
 * │   ├── useProblemList.ts
 * │   ├── useSolutionEditor.ts
 * │   └── useAdminDashboard.ts
 * │
 * └── models/             # MODEL - API clients & types
 *     ├── api.ts
 *     └── types.ts
 * 
 * api/
 * ├── index.ts            # Express routes
 * └── admin-security.ts   # Auth logic
 * 
 * src/infrastructure/     # MODEL - Core services
 * ├── database/
 * │   └── MongoDBService.ts
 * └── services/
 *     ├── GeoLocationService.ts
 *     ├── LocalFileSyncService.ts
 *     └── ProblemHistoryService.ts
 * ```
 * 
 * Benefits:
 * - Separation of concerns
 * - Testability (ViewModels can be unit tested)
 * - Reusability (ViewModels can be shared across views)
 * - Maintainability (clear structure)
 */

export { };
