# FitMitra Mobile App (React Native Expo)

FitMitra is a bilingual (English + Kannada) personal fitness trainer and lifestyle tracking app built with React Native and Expo Router.

## Quick Start

### 1. Install Dependencies
Make sure you are in the `mobile` directory:
```bash
cd mobile
npm install
```

### 2. Configure Backend API (if testing on device/emulator)
Check `mobile/constants/api.js`:
- **Android Emulator**: Uses `http://10.0.2.2:5000/api` (automatically configured)
- **iOS Simulator**: Uses `http://localhost:5000/api` (automatically configured)
- **Physical Device (Expo Go)**: Update `API_URL` to your machine's local Wi-Fi IP address:
  ```js
  export const API_URL = 'http://192.168.x.x:5000/api';
  ```

### 3. Ensure Backend is Running
The Express backend runs on port 5000:
```bash
cd backend
npm run dev
```

### 4. Start the Expo App
From the `mobile` directory:
```bash
# Start Expo development server (interactive QR code)
npx expo start

# Or directly targeting Android
npx expo start --android

# Or for Web preview
npx expo start --web
```

## Features
- **Authentication**: Phone OTP and Email/Password flows connecting to real Express API backend.
- **Onboarding Wizard**: 3-step fitness goal, experience, and biometric profile setup.
- **Dashboard (Home)**: Daily activity stats, nutrition summary ring, quick meal logging, workout recommendations, and AI Coach chatbot.
- **Workouts**: Comprehensive exercise catalogue with muscle group filters and search.
- **Interactive Workout Player**: Real-time timer, sets completion checklist, rest interval countdown, and session logging.
- **Nutrition & Diet**: Daily energy balance, macro targets (protein, carbs, fats), curated healthy Indian recipes, and custom meal logging.
- **Progress Tracking**: Dynamic SVG weight transformation chart, weight history delta logs, and completed workouts log.
- **Profile & Settings**: Biometrics, fitness goals, PRO upgrade modal with mock checkout, bilingual language selector (English / Kannada), and data reset.
