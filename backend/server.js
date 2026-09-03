import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize JSON database if it doesn't exist
const initDb = () => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialDb = {
      users: {
        'sachin@fitmitra.com': {
          password: 'password123',
          profile: {
            name: "Sachin",
            email: "sachin@fitmitra.com",
            age: 24,
            height: 175,
            weight: 72,
            gender: "Male",
            activityLevel: "Moderately Active",
            fitnessGoal: "Muscle Gain",
            experienceLevel: "Intermediate",
            targetCal: 2200,
            targetProtein: 140,
            targetCarbs: 260,
            targetFats: 70,
            currentWeight: 72,
            startingWeight: 78,
            goalWeight: 68,
            streak: 4,
            completedWorkoutsCount: 14,
            isPremium: false,
            activeProgramId: "muscle-gain-12",
            activeProgramWeek: 1
          },
          workoutHistory: [
            { date: '2026-08-17', id: 'core-cardio', name: 'Core Crusher & Cardio', duration: 30, calories: 220, completed: true },
            { date: '2026-08-19', id: 'back-biceps', name: 'Back & Biceps Hypertrophy', duration: 48, calories: 290, completed: true },
            { date: '2026-08-21', id: 'leg-destroyer', name: 'Leg Destroyer Routine', duration: 55, calories: 420, completed: true }
          ],
          nutritionLogs: [
            { id: '1', date: todayStr, mealType: 'Breakfast', name: 'Power Protein Oats', calories: 450, protein: 25, carbs: 60, fats: 10 },
            { id: '2', date: todayStr, mealType: 'Lunch', name: 'High-Protein Grilled Chicken & Rice', calories: 650, protein: 45, carbs: 70, fats: 12 },
            { id: '3', date: todayStr, mealType: 'Snacks', name: 'Berry Blast Whey Shake', calories: 250, protein: 30, carbs: 22, fats: 3 }
          ],
          weightHistory: [
            { date: '2026-08-16', weight: 75.2 },
            { date: '2026-08-17', weight: 74.8 },
            { date: '2026-08-18', weight: 74.3 },
            { date: '2026-08-19', weight: 73.6 },
            { date: '2026-08-20', weight: 73.1 },
            { date: '2026-08-21', weight: 72.5 },
            { date: '2026-08-22', weight: 72.0 }
          ]
        }
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
};

const readDb = () => {
  try {
    initDb();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Migration: Ensure key test users have simulated phone numbers set
    let changed = false;
    if (parsed.users['sachinkumardadmi2006@gmail.com']) {
      if (!parsed.users['sachinkumardadmi2006@gmail.com'].profile.phone) {
        parsed.users['sachinkumardadmi2006@gmail.com'].profile.phone = '9482705834';
        changed = true;
      }
    }
    if (parsed.users['sachin@fitmitra.com']) {
      if (!parsed.users['sachin@fitmitra.com'].profile.phone) {
        parsed.users['sachin@fitmitra.com'].profile.phone = '9999999999';
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    
    return parsed;
  } catch (err) {
    console.error('Error reading JSON database:', err);
    return { users: {} };
  }
};

const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing JSON database:', err);
  }
};

// Middleware for authorization
const getAuthUser = (req, res, next) => {
  const email = req.headers['authorization'];
  if (!email) {
    return res.status(401).json({ message: 'Unauthorized: missing authorization header' });
  }
  const db = readDb();
  const userData = db.users[email.toLowerCase()];
  if (!userData) {
    return res.status(404).json({ message: 'User session not found on server' });
  }
  req.userEmail = email.toLowerCase();
  req.userData = userData;
  req.db = db;
  next();
};

// Store active OTPs in memory
const activeOtps = new Map();

// Initialize Twilio Client if credentials are provided and valid (starts with AC)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && 
                     process.env.TWILIO_ACCOUNT_SID.startsWith('AC') && 
                     process.env.TWILIO_AUTH_TOKEN && 
                     !process.env.TWILIO_AUTH_TOKEN.includes('your_')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (twilioClient) {
  console.log('Twilio client successfully initialized for OTP delivery.');
} else {
  console.log('Twilio credentials not found. SMS delivery will be simulated in console.');
}

// Send SMS helper using Twilio
const sendSms = async (phone, body) => {
  if (twilioClient) {
    try {
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      console.log(`[Twilio] SMS sent successfully to ${formattedPhone}`);
    } catch (err) {
      console.error(`[Twilio] Failed to send SMS to ${phone}:`, err.message || err);
    }
  }
};

// Helper to generate a 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP Endpoint
app.post('/api/auth/request-otp', (req, res) => {
  const { phone, email, name, isSignup } = req.body;
  const db = readDb();

  if (isSignup) {
    if (!email || !phone || !name) {
      return res.status(400).json({ message: 'Name, email, and phone number are required' });
    }
    const normalizedEmail = email.toLowerCase();
    
    // Check if email already exists
    if (db.users[normalizedEmail]) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Check if phone already exists
    const phoneExists = Object.values(db.users).some(u => u.profile && u.profile.phone === phone);
    if (phoneExists) {
      return res.status(400).json({ message: 'User with this phone number already registered' });
    }

    const otp = generateOtp();
    activeOtps.set(phone, { 
      otp, 
      email: normalizedEmail, 
      name, 
      phone, 
      isSignup: true, 
      expires: Date.now() + 5 * 60 * 1000 
    });
    
    console.log(`[OTP SIGNUP] Sent OTP ${otp} to phone ${phone} and email ${email}`);
    
    // Send SMS via Twilio if configured
    sendSms(phone, `Your FitMitra verification code is: ${otp}. Valid for 5 minutes.`);
    
    return res.json({ success: true, message: 'OTP sent successfully', otp });
  } else {
    // Login flow
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Find user by phone number
    const userEntry = Object.entries(db.users).find(([_, u]) => u.profile && u.profile.phone === phone);
    if (!userEntry) {
      return res.status(404).json({ message: 'User not found. Please Sign Up.' });
    }

    const [userEmail, userData] = userEntry;
    const otp = generateOtp();
    activeOtps.set(phone, { 
      otp, 
      email: userEmail, 
      phone, 
      isSignup: false, 
      expires: Date.now() + 5 * 60 * 1000 
    });

    console.log(`[OTP LOGIN] Sent OTP ${otp} to phone ${phone} and email ${userEmail}`);

    // Send SMS via Twilio if configured
    sendSms(phone, `Your FitMitra verification code is: ${otp}. Valid for 5 minutes.`);

    return res.json({ success: true, email: userEmail, message: 'OTP sent successfully', otp });
  }
});

// Verify OTP Endpoint
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required' });
  }

  const activeOtp = activeOtps.get(phone);
  if (!activeOtp || activeOtp.expires < Date.now()) {
    return res.status(400).json({ message: 'OTP has expired or is invalid. Please request a new one.' });
  }

  // Allow standard verification code or universal developer testing code '123456'
  if (activeOtp.otp !== otp && otp !== '123456') {
    return res.status(400).json({ message: 'Invalid OTP code. Please try again.' });
  }

  // Clear OTP after successful verification
  activeOtps.delete(phone);

  const db = readDb();

  if (activeOtp.isSignup) {
    // Complete signup
    const normalizedEmail = activeOtp.email;
    const newProfile = {
      name: activeOtp.name,
      email: normalizedEmail,
      phone: activeOtp.phone,
      age: 25,
      height: 170,
      weight: 70,
      currentWeight: 70,
      startingWeight: 70,
      goalWeight: 68,
      gender: 'Male',
      activityLevel: 'Active',
      fitnessGoal: 'General Fitness',
      experienceLevel: 'Beginner',
      targetCal: 2000,
      targetProtein: 120,
      targetCarbs: 220,
      targetFats: 60,
      streak: 0,
      completedWorkoutsCount: 0,
      isPremium: false,
      activeProgramId: null,
      activeProgramWeek: 1
    };

    db.users[normalizedEmail] = {
      password: '', // Passwordless user
      profile: newProfile,
      workoutHistory: [],
      nutritionLogs: [],
      weightHistory: []
    };

    writeDb(db);

    return res.status(201).json({
      success: true,
      user: newProfile,
      workoutHistory: [],
      nutritionLogs: [],
      weightHistory: []
    });
  } else {
    // Complete login
    const userEmail = activeOtp.email;
    const user = db.users[userEmail];

    return res.json({
      success: true,
      user: user.profile,
      workoutHistory: user.workoutHistory || [],
      nutritionLogs: user.nutritionLogs || [],
      weightHistory: user.weightHistory || []
    });
  }
});

// --- AUTHENTICATION ROUTES ---

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = readDb();
  const normalizedEmail = email.toLowerCase();
  const user = db.users[normalizedEmail];

  // For this prototype, we accept password checks or create users dynamically
  if (user) {
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    return res.json({
      success: true,
      user: user.profile,
      workoutHistory: user.workoutHistory || [],
      nutritionLogs: user.nutritionLogs || [],
      weightHistory: user.weightHistory || []
    });
  } else {
    // If user doesn't exist, we return 401/404 because signup is a separate route
    return res.status(401).json({ message: 'User not found. Please Sign Up.' });
  }
});

// Signup Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const db = readDb();
  const normalizedEmail = email.toLowerCase();

  if (db.users[normalizedEmail]) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Create clean user profile
  const newProfile = {
    name,
    email: normalizedEmail,
    age: 25,
    height: 170,
    weight: 70,
    currentWeight: 70,
    startingWeight: 70,
    goalWeight: 68,
    gender: 'Male',
    activityLevel: 'Active',
    fitnessGoal: 'General Fitness',
    experienceLevel: 'Beginner',
    targetCal: 2000,
    targetProtein: 120,
    targetCarbs: 220,
    targetFats: 60,
    streak: 0,
    completedWorkoutsCount: 0,
    isPremium: false,
    activeProgramId: null,
    activeProgramWeek: 1
  };

  db.users[normalizedEmail] = {
    password,
    profile: newProfile,
    workoutHistory: [],
    nutritionLogs: [],
    weightHistory: []
  };

  writeDb(db);

  res.status(201).json({
    success: true,
    user: newProfile,
    workoutHistory: [],
    nutritionLogs: [],
    weightHistory: []
  });
});

// --- PROTECTED DATA MUTATIONS ---

// Update User Profile
app.post('/api/user/profile', getAuthUser, (req, res) => {
  const { user } = req.body;
  if (!user) {
    return res.status(400).json({ message: 'Missing user object' });
  }

  req.userData.profile = {
    ...req.userData.profile,
    ...user,
    email: req.userEmail // Keep email safe
  };

  writeDb(req.db);

  res.json({
    success: true,
    user: req.userData.profile
  });
});

// Add Workout History
app.post('/api/workouts', getAuthUser, (req, res) => {
  const { workout } = req.body;
  if (!workout) {
    return res.status(400).json({ message: 'Missing workout log' });
  }

  const workoutHistory = req.userData.workoutHistory || [];
  workoutHistory.push(workout);
  req.userData.workoutHistory = workoutHistory;

  // Increment completed counts and streak
  req.userData.profile.completedWorkoutsCount = (req.userData.profile.completedWorkoutsCount || 0) + 1;
  req.userData.profile.streak = (req.userData.profile.streak || 0) + 1;

  writeDb(req.db);

  res.json({
    success: true,
    user: req.userData.profile,
    workoutHistory
  });
});

// Add Nutrition Log
app.post('/api/nutrition', getAuthUser, (req, res) => {
  const { log } = req.body;
  if (!log) {
    return res.status(400).json({ message: 'Missing nutrition log' });
  }

  const nutritionLogs = req.userData.nutritionLogs || [];
  nutritionLogs.push(log);
  req.userData.nutritionLogs = nutritionLogs;

  writeDb(req.db);

  res.json({
    success: true,
    nutritionLogs
  });
});

// Delete Nutrition Log
app.delete('/api/nutrition/:id', getAuthUser, (req, res) => {
  const { id } = req.params;
  let nutritionLogs = req.userData.nutritionLogs || [];
  nutritionLogs = nutritionLogs.filter(log => log.id !== id);
  req.userData.nutritionLogs = nutritionLogs;

  writeDb(req.db);

  res.json({
    success: true,
    nutritionLogs
  });
});

// Add Weight Log
app.post('/api/weight', getAuthUser, (req, res) => {
  const { weight } = req.body;
  if (weight === undefined || weight === null) {
    return res.status(400).json({ message: 'Missing weight value' });
  }

  const weightHistory = req.userData.weightHistory || [];
  const todayStr = new Date().toISOString().split('T')[0];

  // Remove duplicate date entries
  const filtered = weightHistory.filter(h => h.date !== todayStr);
  filtered.push({ date: todayStr, weight: parseFloat(weight) });
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  req.userData.weightHistory = filtered;

  // Update profile weights
  req.userData.profile.currentWeight = parseFloat(weight);
  req.userData.profile.weight = parseFloat(weight);

  writeDb(req.db);

  res.json({
    success: true,
    user: req.userData.profile,
    weightHistory: filtered
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  initDb();
  console.log(`FitMitra backend running on port ${PORT}`);
});
