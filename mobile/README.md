# FitMitra Mobile Native App (React Native & Expo Router)

FitMitra is a bilingual (English + Kannada) personal fitness trainer, nutrition tracker, and supplements commerce mobile application built with React Native and Expo Router, connecting to the FitMitra Express/MongoDB backend (`http://<HOST>:5000/api/v1`).

---

## Professional Architecture & Folder Structure

```
mobile/
├── app/                      # Expo Router File-Based Routing
│   ├── (tabs)/               # Bottom Tab Navigator Screens
│   │   ├── _layout.jsx       # Tab bar configuration & icons (Home, Workout, Diet, Store, Progress, Profile)
│   │   ├── index.jsx         # Home / Consolidated Dashboard & Reward Points Banner
│   │   ├── workouts.jsx      # Exercises & Workout Catalog (Live API)
│   │   ├── nutrition.jsx     # Daily Diet & Meal Tracking (Live API)
│   │   ├── store.jsx         # Supplements Store & Shiprocket Live Tracking (Live API)
│   │   ├── progress.jsx      # Weight Transformation & Workout History (Live API)
│   │   ├── profile.jsx       # User Profile, Biometrics & Points (Live API)
│   │   └── programs.jsx      # Structured Multi-Week Programs (Live API)
│   ├── workout/
│   │   └── [workoutId].jsx   # Interactive Workout Player (+5 Points on Completion)
│   ├── login.jsx             # Authentication Screen (Phone OTP & Email)
│   ├── signup.jsx            # Account Registration Screen
│   ├── onboarding.jsx        # 3-step User Goals & Biometrics Wizard
│   ├── premium.jsx           # Pro Membership Paywall (Razorpay Integration)
│   ├── _layout.jsx           # Root layout with AuthProvider & Stack Navigation
│   └── +not-found.jsx        # 404 Fallback
├── components/               # Reusable Modular UI Components
│   ├── common/               # Primitives (LoadingSpinner, EmptyState, Badge, StatCard)
│   ├── modals/               # Modals (PointsCelebrationModal)
│   ├── store/                # Store Widgets (ProductCard, TrackingTimeline, OrderCard, OrderModal)
│   └── index.js              # Unified components barrel exports
├── context/                  # Global State Management
│   └── AuthContext.jsx       # Auth session, user, live profile & points state
├── hooks/                    # Custom React Hooks
│   ├── useAuth.js            # Authentication state hook
│   └── usePoints.js          # Live points balance & refresh hook
├── services/                 # Modular API Services Layer
│   ├── api.js                # Core Axios/Fetch client with Bearer token injection
│   ├── authService.js        # Auth session, token storage & sync
│   ├── dashboardService.js   # Consolidated single-endpoint dashboard API
│   ├── workoutService.js     # Exercises, programs, start/log/complete workout APIs
│   ├── nutritionService.js   # Recipes, daily logs, meal creation & deletion APIs
│   ├── storeService.js       # Products, cash & points checkout, order tracking APIs
│   ├── aiService.js          # LangChain RAG AI chat API
│   ├── subscriptionService.js# Plans, subscription orders & payment verification
│   ├── profileService.js     # User biometrics, goals & points API
│   └── index.js              # Unified service exports
├── constants/                # App Constants & Theme Tokens
│   ├── api.js                # Base URL configuration (targeting /api/v1)
│   └── theme.js              # Design system tokens (Neon, Glassmorphism, Colors)
└── utils/                    # Utility Helpers
    ├── i18n.js               # Bilingual translations (English & Kannada)
    ├── events.js             # EventEmitter for reactive cross-component updates
    └── aiCoach.js            # Fitness knowledge base & offline fallback
```

---

## Key Features & Backend Integrations

1. **Zero-Trust Client Authentication**:
   - Client sends `Authorization: Bearer <idToken>` (or `Bearer dev-token` in development).
   - Session and profile synchronized via `POST /api/v1/auth/sync`.

2. **Consolidated Dashboard (`GET /api/v1/dashboard`)**:
   - Single network call loads today's workout, nutrition totals, recent sessions, and 7-day stats.
   - Dynamic **Reward Points (`⚡ pts`)** banner with direct navigation to the Supplements Store.

3. **Workout Player with Reward Points**:
   - Session lifecycle managed via `POST /api/v1/workouts/start`, `log-exercise`, and `complete`.
   - Completing a workout triggers atomic database award of **+5 Reward Points** and displays the celebratory celebration dialog.

4. **Supplements Store & Live Shiprocket Tracking**:
   - Supplements catalog (`GET /api/v1/store/products`): Whey Protein, Creatine, Oats.
   - Dual checkout: Cash (₹) via `POST /api/v1/store/orders/cash` and **Points Redemption (⚡ pts)** via `POST /api/v1/store/orders/points`.
   - Real-time Shiprocket shipment tracking (`GET /api/v1/shipping/track/:awb`) with vertical checkpoint timeline stepper.

5. **Nutrition & Meal Tracking**:
   - Daily logs fetched from `GET /api/v1/nutrition/logs?date=YYYY-MM-DD`.
   - Meal additions via `POST /api/v1/nutrition/logs` and deletions via `DELETE /api/v1/nutrition/logs/:logId/items/:itemId`.
   - Real-time daily energy balance (Calories, Protein, Carbs, Fats).

6. **LangChain Gemini AI Coach**:
   - Chat connected to `POST /api/v1/ai/chat` with Kannada & English bilingual fitness assistance.
   - Automatic offline fallback.

7. **Pro Subscriptions & Payments**:
   - Real tiers fetched from `GET /api/v1/subscriptions/plans`.
   - Order creation and verification via `POST /api/v1/subscriptions/create` and `POST /api/v1/payments/verify`.

---

## Quick Start

```bash
# Navigate to mobile directory
cd mobile

# Start Expo development server
npx expo start
```
