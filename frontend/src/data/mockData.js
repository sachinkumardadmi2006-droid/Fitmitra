// FitMitra Mock Data

export const EXERCISES = [
  {
    id: "bench-press",
    name: "Bench Press",
    category: "Chest",
    targetMuscle: "Pectoralis Major (Chest)",
    equipment: "Barbell & Flat Bench",
    difficulty: "Intermediate",
    defaultSets: 4,
    defaultReps: 10,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Lie flat on your back on a bench.",
      "Grip the barbell with hands slightly wider than shoulder-width apart.",
      "Unrack the bar and slowly lower it to your mid-chest while keeping your elbows at roughly a 45-degree angle.",
      "Push the bar back up explosively to the starting position, extending your arms but not locking your elbows.",
      "Inhale on the way down, exhale as you push up."
    ],
    tips: [
      "Keep your feet planted firmly on the floor to stabilize your body.",
      "Retract your shoulder blades and squeeze them together throughout the lift to protect your rotator cuffs."
    ],
    mistakes: [
      "Bouncing the barbell off your chest.",
      "Flaring your elbows out to 90 degrees, which places excessive stress on the shoulders."
    ]
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    targetMuscle: "Upper Chest & Anterior Deltoids",
    equipment: "Dumbbells & Incline Bench",
    difficulty: "Intermediate",
    defaultSets: 4,
    defaultReps: 12,
    defaultRest: 75,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Set an incline bench to around 30 to 45 degrees.",
      "Sit back with a dumbbell in each hand, resting them on your thighs.",
      "Lie back and press the dumbbells up over your chest, palms facing forward.",
      "Lower the dumbbells slowly to the sides of your upper chest.",
      "Press the weights back up to the starting position in a controlled arc."
    ],
    tips: [
      "Focus on squeezing the upper chest fibers at the top of the movement.",
      "Ensure the incline isn't too steep, or your front shoulders will take over the lift."
    ],
    mistakes: [
      "Allowing the dumbbells to collide at the top, which releases tension from the chest."
    ]
  },
  {
    id: "chest-fly",
    name: "Dumbbell Chest Fly",
    category: "Chest",
    targetMuscle: "Outer Chest & Inner Cleavage",
    equipment: "Dumbbells & Flat Bench",
    difficulty: "Intermediate",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: 60,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Lie on a flat bench holding dumbbells directly above your chest, palms facing each other.",
      "With a slight bend in your elbows, lower your arms out to the sides in a wide arc until you feel a deep stretch in your chest.",
      "Squeeze your chest muscles to bring the dumbbells back to the starting position along the same arc."
    ],
    tips: [
      "Imagine hugging a wide tree trunk to keep the arm curvature constant.",
      "Do not over-extend or go below shoulder height to protect your joints."
    ],
    mistakes: [
      "Bending the elbows too much, turning the fly into a press."
    ]
  },
  {
    id: "push-ups",
    name: "Push Ups",
    category: "Chest",
    targetMuscle: "Pectorals, Triceps, and Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: 60,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Place hands shoulder-width apart on the floor, fingers pointing slightly outwards.",
      "Extend your legs backward and keep your body in a straight line from head to heels.",
      "Lower your chest to the floor by bending your elbows.",
      "Push through your hands to return to the plank position."
    ],
    tips: [
      "Keep your core and glutes squeezed to prevent your hips from sagging.",
      "Your gaze should be slightly forward, not straight down."
    ],
    mistakes: [
      "Hips sagging or hiking high in the air.",
      "Flaring elbows outwards."
    ]
  },
  {
    id: "tricep-pushdown",
    name: "Cable Tricep Pushdown",
    category: "Arms",
    targetMuscle: "Lateral and Medial Tricep Heads",
    equipment: "Cable Machine & Rope Attachment",
    difficulty: "Beginner",
    defaultSets: 4,
    defaultReps: 12,
    defaultRest: 60,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Attach a rope to a high pulley and stand facing the machine.",
      "Grip the rope, tuck your elbows into your sides, and bend your arms to 90 degrees.",
      "Push the rope downwards by extending your elbows, spreading the ends of the rope at the bottom.",
      "Slowly return to the starting position."
    ],
    tips: [
      "Keep your elbows pinned to your ribs throughout the entire movement.",
      "Lean forward slightly from the hips for a better range of motion."
    ],
    mistakes: [
      "Using momentum/swinging your torso to force the weight down."
    ]
  },
  {
    id: "skull-crushers",
    name: "Skull Crushers (Lying Triceps Extension)",
    category: "Arms",
    targetMuscle: "Long Head of Triceps",
    equipment: "EZ Bar & Flat Bench",
    difficulty: "Intermediate",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: 75,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Lie on a flat bench, holding an EZ bar over your chest with a shoulder-width grip.",
      "Keeping your upper arms stationary, bend at the elbows to lower the bar towards your forehead.",
      "Stop just before the bar touches your forehead, then contract your triceps to push the bar back up."
    ],
    tips: [
      "Angle your upper arms slightly backward (towards your head) to keep constant tension on the triceps."
    ],
    mistakes: [
      "Moving your elbows forward and backward, which recruits the shoulders."
    ]
  },
  {
    id: "dips",
    name: "Chest Dips",
    category: "Arms",
    targetMuscle: "Lower Chest & Triceps",
    equipment: "Parallel Bars",
    difficulty: "Intermediate",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Grab the parallel bars and hoist yourself up so your arms are fully extended.",
      "Cross your legs and lean your torso slightly forward.",
      "Lower your body by bending your elbows until your shoulders are slightly below your elbows.",
      "Push yourself back up to the starting position."
    ],
    tips: [
      "Leaning forward targets the chest; keeping the body upright targets the triceps."
    ],
    mistakes: [
      "Swinging your legs to create momentum.",
      "Going too deep too fast, which can injure the shoulders."
    ]
  },
  {
    id: "overhead-extension",
    name: "Overhead Dumbbell Tricep Extension",
    category: "Arms",
    targetMuscle: "Triceps Long Head",
    equipment: "Dumbbell",
    difficulty: "Beginner",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: 60,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Sit on a seat or stand with feet shoulder-width apart.",
      "Hold one dumbbell with both hands underneath the inner plate, lifting it overhead.",
      "Keeping your elbows close to your ears, lower the weight behind your head.",
      "Contract your triceps to lift the dumbbell back to arm's length overhead."
    ],
    tips: [
      "Keep your core engaged to avoid arching your lower back."
    ],
    mistakes: [
      "Elbows flaring far outwards."
    ]
  },
  // BACK EXERCISES
  {
    id: "pull-ups",
    name: "Pull Ups",
    category: "Back",
    targetMuscle: "Latissimus Dorsi (Lats)",
    equipment: "Pull Up Bar",
    difficulty: "Advanced",
    defaultSets: 4,
    defaultReps: 8,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Hang from a pull-up bar with hands wider than shoulder-width, palms facing away (overhand grip).",
      "Pull your shoulder blades down and back.",
      "Drive your elbows towards your hips, lifting your chest to the bar.",
      "Lower yourself slowly back to a dead hang."
    ],
    tips: [
      "Focus on pulling through your elbows rather than pulling with your hands."
    ],
    mistakes: [
      "Using leg kick (kipping) to get over the bar.",
      "Not completing the full range of motion."
    ]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    category: "Back",
    targetMuscle: "Lats & Upper Back",
    equipment: "Cable Lat Machine",
    difficulty: "Beginner",
    defaultSets: 4,
    defaultReps: 12,
    defaultRest: 75,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Sit on the machine, adjust the thigh pads, and grip the wide bar with an overhand grip.",
      "Pull the bar down to your upper chest while leaning back slightly.",
      "Squeeze your shoulder blades together at the bottom.",
      "Slowly release the bar back up to the starting position."
    ],
    tips: [
      "Keep your chest high and puff it out as the bar approaches."
    ],
    mistakes: [
      "Pulling the bar behind your neck (dangerous for shoulder joints).",
      "Leaning back excessively to pull the bar using body weight."
    ]
  },
  {
    id: "bent-over-row",
    name: "Bent-Over Barbell Row",
    category: "Back",
    targetMuscle: "Middle Back, Rhomboids, Lats",
    equipment: "Barbell & Plates",
    difficulty: "Intermediate",
    defaultSets: 4,
    defaultReps: 10,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Hold a barbell with an overhand grip, feet shoulder-width apart.",
      "Bend your knees slightly and hinge forward at the hips, keeping your back straight and nearly parallel to the floor.",
      "Pull the bar to your lower ribcage, squeezing your shoulder blades.",
      "Lower the bar back down under control."
    ],
    tips: [
      "Keep your head in a neutral position, looking at the floor a few feet in front of you."
    ],
    mistakes: [
      "Rounding your lower back (highly dangerous for spine).",
      "Using a bouncing motion to lift the weight."
    ]
  },
  {
    id: "barbell-curl",
    name: "Barbell Bicep Curl",
    category: "Arms",
    targetMuscle: "Biceps Brachii",
    equipment: "Barbell",
    difficulty: "Beginner",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: 60,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Stand with feet shoulder-width apart, holding a barbell with an underhand grip.",
      "Keep your elbows pinned close to your torso.",
      "Curl the bar upward by contracting your biceps while keeping the rest of your body completely still.",
      "Lower the bar slowly back to the starting position."
    ],
    tips: [
      "Squeeze your biceps hard at the peak of the contraction."
    ],
    mistakes: [
      "Swinging your body and using shoulder power to curl."
    ]
  },
  // LEGS EXERCISES
  {
    id: "squats",
    name: "Barbell Back Squats",
    category: "Legs",
    targetMuscle: "Quadriceps, Glutes, Hamstrings",
    equipment: "Squat Rack & Barbell",
    difficulty: "Advanced",
    defaultSets: 4,
    defaultReps: 8,
    defaultRest: 120,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Place the barbell on your upper back/traps, standing with feet slightly wider than shoulder-width.",
      "Push your hips back and bend your knees to lower your body, keeping your chest up and spine neutral.",
      "Go down until your thighs are at least parallel to the floor (deep squat).",
      "Drive through your heels to push back up to standing."
    ],
    tips: [
      "Keep your knees aligned with your toes; don't let them collapse inwards.",
      "Brace your core before each rep."
    ],
    mistakes: [
      "Heels lifting off the floor.",
      "Rounding the lower back at the bottom ('butt wink')."
    ]
  },
  {
    id: "leg-press",
    name: "Leg Press",
    category: "Legs",
    targetMuscle: "Quadriceps & Glutes",
    equipment: "Leg Press Machine",
    difficulty: "Beginner",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Sit on the machine, placing your feet shoulder-width apart on the sled.",
      "Release the safety locks and slowly bend your knees to lower the platform towards your chest.",
      "Push the sled back up using your legs, but do not lock your knees."
    ],
    tips: [
      "Keep your lower back pressed firmly against the seat padding."
    ],
    mistakes: [
      "Locking knees out fully at the top (can cause catastrophic joint failure).",
      "Lifting hips off the seat at the bottom."
    ]
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    category: "Legs",
    targetMuscle: "Hamstrings & Gluteus Maximus",
    equipment: "Barbell or Dumbbells",
    difficulty: "Intermediate",
    defaultSets: 4,
    defaultReps: 10,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Stand tall holding a barbell in front of you, feet shoulder-width apart.",
      "Keeping a slight bend in your knees, hinge forward at the hips, pushing your butt backward.",
      "Slide the bar down your thighs, keeping it close, until you feel a deep stretch in your hamstrings.",
      "Squeeze your glutes and pull yourself back up."
    ],
    tips: [
      "This is a hip hinge, not a squat. Your knees should barely bend."
    ],
    mistakes: [
      "Letting the bar drift away from your shins.",
      "Rounding your spine."
    ]
  },
  // SHOULDERS
  {
    id: "overhead-press",
    name: "Barbell Overhead Press",
    category: "Shoulders",
    targetMuscle: "Anterior Deltoids & Triceps",
    equipment: "Barbell & Rack",
    difficulty: "Advanced",
    defaultSets: 4,
    defaultReps: 8,
    defaultRest: 90,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Stand with feet shoulder-width apart, racking the bar on your front shoulders.",
      "Brace your core, squeeze your glutes, and press the bar straight up overhead.",
      "Pull your head back slightly as the bar passes your face, then push it forward ('push your head through the window') at the top."
    ],
    tips: [
      "Ensure your forearms are vertical underneath the bar before lifting."
    ],
    mistakes: [
      "Bending your knees to turn it into a push press.",
      "Arching the lower back excessively."
    ]
  },
  {
    id: "lateral-raise",
    name: "Dumbbell Lateral Raise",
    category: "Shoulders",
    targetMuscle: "Lateral Deltoids (Side Shoulders)",
    equipment: "Dumbbells",
    difficulty: "Beginner",
    defaultSets: 4,
    defaultReps: 15,
    defaultRest: 60,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Stand tall holding light dumbbells at your sides, palms facing inwards.",
      "With a very slight bend in your elbows, raise your arms out to the sides in a wide arc.",
      "Raise the weights until your arms are parallel to the floor, pinky fingers tilted slightly up.",
      "Slowly lower them back down."
    ],
    tips: [
      "Lead the movement with your elbows.",
      "Focus on shoulder contraction, not swinging the weight."
    ],
    mistakes: [
      "Using heavy weights and swinging the torso.",
      "Lifting weights higher than shoulders."
    ]
  },
  // ABS
  {
    id: "plank",
    name: "Forearm Plank",
    category: "Abs",
    targetMuscle: "Rectus Abdominis & Transverse Abdominis",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    defaultSets: 3,
    defaultReps: 60,
    defaultRest: 45,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Place your forearms on the floor, elbows aligned under shoulders.",
      "Extend your legs behind, toes on the floor. Hold a straight-line posture.",
      "Keep your abdominal muscles tight, breathing steadily."
    ],
    tips: [
      "Squeeze your glutes and quads to keep your spine stable.",
      "Press the floor away through your elbows so your shoulders don't sag."
    ],
    mistakes: [
      "Letting your hips sag toward the ground.",
      "Looking up, straining your neck."
    ]
  },
  {
    id: "crunches",
    name: "Abdominal Crunches",
    category: "Abs",
    targetMuscle: "Upper Abs",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    defaultSets: 3,
    defaultReps: 20,
    defaultRest: 45,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    instructions: [
      "Lie on your back with knees bent and feet flat on the floor.",
      "Place hands lightly behind your head, elbows wide.",
      "Contract your abs to lift your shoulders off the floor, keeping your lower back pressed down.",
      "Slowly lower back down."
    ],
    tips: [
      "Look at the ceiling to avoid pulling on your neck."
    ],
    mistakes: [
      "Yanking your head forward with your hands."
    ]
  }
];

export const WORKOUTS = [
  {
    id: "chest-triceps",
    name: "Chest & Triceps Focus",
    difficulty: "Intermediate",
    duration: 45,
    calories: 320,
    category: "Chest",
    tagline: "Build a strong chest and powerful triceps with this hypertrophy routine.",
    exercises: [
      { exerciseId: "bench-press", sets: 4, reps: "10", rest: 90 },
      { exerciseId: "incline-dumbbell-press", sets: 4, reps: "12", rest: 75 },
      { exerciseId: "chest-fly", sets: 3, reps: "12", rest: 60 },
      { exerciseId: "push-ups", sets: 3, reps: "15", rest: 60 },
      { exerciseId: "tricep-pushdown", sets: 4, reps: "12", rest: 60 },
      { exerciseId: "skull-crushers", sets: 3, reps: "10", rest: 75 },
      { exerciseId: "dips", sets: 3, reps: "8", rest: 90 },
      { exerciseId: "overhead-extension", sets: 3, reps: "12", rest: 60 }
    ]
  },
  {
    id: "back-biceps",
    name: "Back & Biceps Hypertrophy",
    difficulty: "Intermediate",
    duration: 48,
    calories: 290,
    category: "Back",
    tagline: "Carve out width and depth in your back while blasting your biceps.",
    exercises: [
      { exerciseId: "pull-ups", sets: 4, reps: "8", rest: 90 },
      { exerciseId: "lat-pulldown", sets: 4, reps: "12", rest: 75 },
      { exerciseId: "bent-over-row", sets: 4, reps: "10", rest: 90 },
      { exerciseId: "barbell-curl", sets: 4, reps: "10", rest: 60 },
      { exerciseId: "tricep-pushdown", sets: 3, reps: "12", rest: 60 }
    ]
  },
  {
    id: "leg-destroyer",
    name: "Leg Destroyer Routine",
    difficulty: "Advanced",
    duration: 55,
    calories: 420,
    category: "Legs",
    tagline: "Devastating leg day to pack size onto your quads, hamstrings, and glutes.",
    exercises: [
      { exerciseId: "squats", sets: 4, reps: "8", rest: 120 },
      { exerciseId: "leg-press", sets: 4, reps: "12", rest: 90 },
      { exerciseId: "romanian-deadlift", sets: 4, reps: "10", rest: 90 }
    ]
  },
  {
    id: "shoulder-blast",
    name: "3D Shoulder Blast",
    difficulty: "Intermediate",
    duration: 40,
    calories: 250,
    category: "Shoulders",
    tagline: "Build capped, wide shoulders with overhead pressing and lateral work.",
    exercises: [
      { exerciseId: "overhead-press", sets: 4, reps: "8", rest: 90 },
      { exerciseId: "lateral-raise", sets: 4, reps: "15", rest: 60 },
      { exerciseId: "push-ups", sets: 3, reps: "12", rest: 60 }
    ]
  },
  {
    id: "core-cardio",
    name: "Core Crusher & Cardio",
    difficulty: "Beginner",
    duration: 30,
    calories: 220,
    category: "Abs",
    tagline: "Burn fat and build an iron core with high-intensity bodyweight movements.",
    exercises: [
      { exerciseId: "plank", sets: 3, reps: "60", rest: 45 },
      { exerciseId: "crunches", sets: 3, reps: "20", rest: 45 },
      { exerciseId: "push-ups", sets: 3, reps: "15", rest: 60 }
    ]
  }
];

export const RECIPES = [
  {
    id: "protein-oats",
    name: "Power Protein Oats",
    category: "Breakfast",
    calories: 450,
    protein: 25,
    carbs: 60,
    fats: 10,
    prepTime: 5,
    cookTime: 5,
    imageUrl: "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "1/2 cup Rolled Oats",
      "1 scoop Whey Protein Powder",
      "1 cup Skimmed Milk",
      "1 medium Banana, sliced",
      "1 tbsp Peanut Butter",
      "1 tsp Honey"
    ],
    preparation: [
      "Add oats and milk to a saucepan. Bring to a gentle boil, then simmer for 4-5 minutes, stirring occasionally.",
      "Remove from heat and let it cool for 1 minute.",
      "Stir in the protein powder thoroughly.",
      "Transfer to a bowl and top with sliced banana, peanut butter, and a drizzle of honey."
    ]
  },
  {
    id: "eggs-avocado",
    name: "Scrambled Eggs & Avocado Toast",
    category: "Breakfast",
    calories: 380,
    protein: 20,
    carbs: 30,
    fats: 18,
    prepTime: 5,
    cookTime: 5,
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "3 Whole Eggs",
      "2 slices Whole Wheat Bread",
      "1/2 ripe Avocado",
      "1 tsp Olive Oil",
      "Salt, Pepper & Red Pepper Flakes (to taste)"
    ],
    preparation: [
      "Toast the whole wheat bread slices until golden brown.",
      "Whisk eggs with a pinch of salt and pepper.",
      "Heat olive oil in a non-stick pan. Sauté soft scrambled eggs.",
      "Mash avocado and spread onto toast. Lay eggs on top and garnish with chili flakes."
    ]
  },
  {
    id: "chicken-rice",
    name: "High-Protein Grilled Chicken & Rice",
    category: "Lunch",
    calories: 650,
    protein: 45,
    carbs: 70,
    fats: 12,
    prepTime: 15,
    cookTime: 20,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "150g Chicken Breast, boneless",
      "1 cup Cooked Basmati Rice (Brown or White)",
      "1 cup Broccoli florets & Baby Carrots",
      "1 tbsp Olive Oil",
      "Garlic Powder, Paprika, Oregano, Salt & Pepper"
    ],
    preparation: [
      "Marinate chicken breast with olive oil, salt, pepper, garlic powder, and paprika.",
      "Grill chicken breast for 6-8 minutes on each side.",
      "Steam broccoli and carrots until fork-tender.",
      "Slice the grilled chicken and serve over warm rice alongside steamed vegetables."
    ]
  },
  {
    id: "paneer-salad",
    name: "Spiced Paneer Tikka Salad",
    category: "Lunch",
    calories: 480,
    protein: 24,
    carbs: 18,
    fats: 28,
    prepTime: 10,
    cookTime: 10,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "120g Paneer, cubed",
      "1 cup Mixed Salad Greens (Lettuce, Cucumber, Tomato)",
      "1/2 Bell Pepper & 1/2 Red Onion, diced",
      "2 tbsp Greek Yogurt (for marinade)",
      "1 tsp Tandoori Masala & Lemon Juice"
    ],
    preparation: [
      "Mix paneer cubes, bell pepper, and onions with Greek yogurt and spices.",
      "Sauté in a non-stick pan over medium heat for 6-8 minutes.",
      "Toss salad greens in a bowl with a squeeze of lemon juice.",
      "Top with the warm grilled paneer and vegetable tikka mix."
    ]
  },
  {
    id: "salmon-potato",
    name: "Omega-3 Baked Salmon & Sweet Potato",
    category: "Dinner",
    calories: 520,
    protein: 35,
    carbs: 45,
    fats: 20,
    prepTime: 10,
    cookTime: 25,
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "140g Salmon Fillet",
      "1 medium Sweet Potato, cubed",
      "1 cup Asparagus spears",
      "1 tbsp Olive Oil",
      "Lemon slices, Dill, Salt & Lemon Pepper"
    ],
    preparation: [
      "Preheat oven to 400°F (200°C).",
      "Toss sweet potato cubes with olive oil and roast for 10 minutes.",
      "Season salmon with lemon juice, salt, and dill. Bake alongside sweet potatoes and asparagus for 15 mins."
    ]
  },
  {
    id: "fruit-protein-shake",
    name: "Berry Blast Whey Shake",
    category: "Snacks",
    calories: 250,
    protein: 30,
    carbs: 22,
    fats: 3,
    prepTime: 3,
    cookTime: 0,
    imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "1 scoop Whey Protein Powder",
      "1/2 cup Mixed Frozen Berries",
      "1 cup Cold Almond Milk",
      "4-5 Ice Cubes"
    ],
    preparation: [
      "Add all ingredients to a high-speed blender.",
      "Blend on high for 45-60 seconds until smooth.",
      "Serve cold."
    ]
  },
  {
    id: "ragi-mudde",
    name: "Ragi Mudde with Chicken Saaru",
    nameKn: "ರಾಗಿ ಮುದ್ದೆ ಮತ್ತು ಕೋಳಿ ಸಾರು",
    category: "Lunch",
    calories: 550,
    protein: 35,
    carbs: 65,
    fats: 15,
    prepTime: 15,
    cookTime: 25,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "2 cups Finger Millet (Ragi) Flour",
      "150g Chicken pieces (for curry)",
      "Karnataka spices (Onion, Garlic, Ginger, Coriander, Coconut)",
      "1 tsp Ghee"
    ],
    preparation: [
      "Boil water in a pot, add ragi flour and stir continuously to form a lump-free dough ball (Mudde).",
      "Cook chicken with ground coconut-spice paste to prepare traditional Saaru.",
      "Serve hot ragi mudde with a teaspoon of ghee and chicken saaru."
    ]
  },
  {
    id: "jolada-roti",
    name: "Jolada Roti with Yennegai",
    nameKn: "ಜೋಳದ ರೊಟ್ಟಿ ಮತ್ತು ಎಣ್ಣೆಗಾಯಿ ಬದನೆಕಾಯಿ",
    category: "Dinner",
    calories: 480,
    protein: 12,
    carbs: 70,
    fats: 18,
    prepTime: 20,
    cookTime: 20,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "2 Jowar (Sorghum) Roti",
      "3 Small Brinjals (Eggplant)",
      "Spiced peanut-sesame masala paste",
      "1 tbsp Groundnut oil"
    ],
    preparation: [
      "Prepare Jowar rotis by patting hot dough and roasting on a flat griddle.",
      "Stuff brinjals with peanut-sesame masala and cook in oil to make Yennegai.",
      "Serve hot rotis with eggplant curry."
    ]
  },
  {
    id: "idli-sambar",
    name: "Steamed Idli with Sambar",
    nameKn: "ಇಡ್ಲಿ ಮತ್ತು ಸಾಂಬಾರ್",
    category: "Breakfast",
    calories: 320,
    protein: 10,
    carbs: 58,
    fats: 4,
    prepTime: 10,
    cookTime: 15,
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "3 Steamed Idlis (fermented rice-urad dal batter)",
      "1 cup Mixed vegetable Sambar (Lentils, drumsticks, pumpkin)",
      "2 tbsp Fresh coconut chutney"
    ],
    preparation: [
      "Steam idli batter in an idli mould for 10-12 minutes.",
      "Prepare sambar with boiled lentils and sambar powder.",
      "Serve warm idlis with hot sambar and chutney."
    ]
  }
];

export const PROGRAMS = [
  {
    id: "pcod-pcos-hormonal",
    name: "PCOS & PCOD Hormonal Balance",
    nameKn: "ಪಿ ಸಿ ಒ ಎಸ್ / ಪಿ ಸಿ ಒ ಡಿ ಹಾರ್ಮೋನ್ ಸಮತೋಲನ",
    durationWeeks: 4,
    level: "Beginner",
    goal: "Hormone Balance",
    goalKn: "ಹಾರ್ಮೋನ್ ಸಮತೋಲನ",
    description: "A specialized, problem-oriented fitness path designed for PCOS & PCOD management. Regulates hormones, controls weight, reduces stress, and manages insulin resistance through low-intensity HIIT, yoga, and a clean fiber-rich diet.",
    descriptionKn: "ಹಾರ್ಮೋನ್ ನಿಯಂತ್ರಣ, ಒತ್ತಡ ನಿವಾರಣೆ ಮತ್ತು ಇನ್ಸುಲಿನ್ ಪ್ರತಿರೋಧ ನಿರ್ವಹಣೆಗಾಗಿ ಕಡಿಮೆ ತೀವ್ರತೆಯ ಹೈಟ್ (HIIT), ಯೋಗ ಮತ್ತು ನಾರಿನಾಂಶ ಭರಿತ ಆಹಾರ ಪದ್ಧತಿಯನ್ನು ಒಳಗೊಂಡ ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮ.",
    tagline: "Regulate hormones, manage PCOD/PCOS symptoms.",
    taglineKn: "ಹಾರ್ಮೋನುಗಳನ್ನು ನಿಯಂತ್ರಿಸಿ, ಪಿಸಿಒಡಿ ರೋಗಲಕ್ಷಣಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    weeks: [
      {
        week: 1,
        schedule: [
          { day: "Monday", activity: "Workout: Core Crusher & Cardio", workoutId: "core-cardio" },
          { day: "Tuesday", activity: "Active Recovery: 20 min Walk", workoutId: null },
          { day: "Wednesday", activity: "Workout: Core Crusher & Cardio", workoutId: "core-cardio" },
          { day: "Thursday", activity: "Rest Day", workoutId: null },
          { day: "Friday", activity: "Active Recovery: Stretch Routine", workoutId: null },
          { day: "Saturday", activity: "Rest Day", workoutId: null },
          { day: "Sunday", activity: "Active Recovery: Walk", workoutId: null }
        ]
      }
    ]
  },
  {
    id: "testosterone-boost",
    name: "Men's Hormonal Health & Testosterone Boost",
    nameKn: "ಪುರುಷರ ಹಾರ್ಮೋನ್ ಮತ್ತು ಟೆಸ್ಟೋಸ್ಟೆರಾನ್ ಬೂಸ್ಟ್",
    durationWeeks: 6,
    level: "Intermediate",
    goal: "Testosterone Optimization",
    goalKn: "ಟೆಸ್ಟೋಸ್ಟೆರಾನ್ ಉತ್ತಮಗೊಳಿಸುವಿಕೆ",
    description: "Strength-focused compound resistance training combined with specific macronutrient targets and healthy habits to optimize natural testosterone levels, reduce fatigue, and build lean muscle.",
    descriptionKn: "ಪುರುಷರ ನೈಸರ್ಗಿಕ ಟೆಸ್ಟೋಸ್ಟೆರಾನ್ ಹೆಚ್ಚಿಸಲು ಮತ್ತು ನೇರ ಸ್ನಾಯು ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡುವ ಕಾಂಪೌಂಡ್ ಲಿಫ್ಟಿಂಗ್ ಮತ್ತು ಪೌಷ್ಟಿಕಾಂಶ ಭರಿತ ಅಭ್ಯಾಸಗಳ ಕಾರ್ಯಕ್ರಮ.",
    tagline: "Optimize natural testosterone & strength.",
    taglineKn: "ನೈಸರ್ಗಿಕ ಟೆಸ್ಟೋಸ್ಟೆರಾನ್ ಮತ್ತು ಶಕ್ತಿಯನ್ನು ಉತ್ತಮಗೊಳಿಸಿ.",
    weeks: [
      {
        week: 1,
        schedule: [
          { day: "Monday", activity: "Workout: Leg Destroyer Routine", workoutId: "leg-destroyer" },
          { day: "Tuesday", activity: "Workout: Back & Biceps Hypertrophy", workoutId: "back-biceps" },
          { day: "Wednesday", activity: "Rest Day", workoutId: null },
          { day: "Thursday", activity: "Workout: Chest & Triceps Focus", workoutId: "chest-triceps" },
          { day: "Friday", activity: "Workout: 3D Shoulder Blast", workoutId: "shoulder-blast" },
          { day: "Saturday", activity: "Rest Day", workoutId: null },
          { day: "Sunday", activity: "Rest Day", workoutId: null }
        ]
      }
    ]
  },
  {
    id: "belly-chest-fat-reduction",
    name: "Weight & Belly/Chest Fat Reduction",
    nameKn: "ತೂಕ ಮತ್ತು ಹೊಟ್ಟೆ/ಎದೆ ಕೊಬ್ಬು ಕಡಿತ",
    durationWeeks: 8,
    level: "Intermediate",
    goal: "Targeted Fat Loss",
    goalKn: "ಉದ್ದೇಶಿತ ಕೊಬ್ಬು ಕಡಿತ",
    description: "A fast-paced, high calorie-burning conditioning split targeting stubborn visceral fat (belly) and chest fat. Focuses on full-body HIIT, core strengthening, and fat-burning metabolic circuits.",
    descriptionKn: "ದೇಹದ ತೂಕ ಮತ್ತು ಹಠಮಾರಿ ಹೊಟ್ಟೆ ಹಾಗೂ ಎದೆಯ ಕೊಬ್ಬನ್ನು ಕರಗಿಸಲು ಸಹಾಯ ಮಾಡುವ ಅತ್ಯಂತ ತೀವ್ರತೆಯ ಕಾರ್ಡಿಯೋ ಮತ್ತು ಕ್ಯಾಲೊರಿ ಕೊರತೆಯ ಆಹಾರ ಯೋಜನೆ.",
    tagline: "Target stubborn belly & chest fat.",
    taglineKn: "ಹಠಮಾರಿ ಹೊಟ್ಟೆ ಮತ್ತು ಎದೆಯ ಕೊಬ್ಬನ್ನು ಕರಗಿಸಿ.",
    weeks: [
      {
        week: 1,
        schedule: [
          { day: "Monday", activity: "Workout: Core Crusher & Cardio", workoutId: "core-cardio" },
          { day: "Tuesday", activity: "Workout: 3D Shoulder Blast", workoutId: "shoulder-blast" },
          { day: "Wednesday", activity: "Cardio: 30 min Jog", workoutId: null },
          { day: "Thursday", activity: "Workout: Chest & Triceps Focus", workoutId: "chest-triceps" },
          { day: "Friday", activity: "Workout: Core Crusher & Cardio", workoutId: "core-cardio" },
          { day: "Saturday", activity: "Rest Day", workoutId: null },
          { day: "Sunday", activity: "Rest Day", workoutId: null }
        ]
      }
    ]
  },
  {
    id: "beginner-habit",
    name: "Beginner Fitness Habit",
    nameKn: "ಆರಂಭಿಕ ಫಿಟ್‌ನೆಸ್ ಅಭ್ಯಾಸ",
    durationWeeks: 4,
    level: "Beginner",
    goal: "General Fitness",
    goalKn: "ಸಾಮಾನ್ಯ ಫಿಟ್‌ನೆಸ್",
    description: "Start your journey here. Build foundational strength, joint stability, and healthy eating habits without burning out.",
    descriptionKn: "ನಿಮ್ಮ ಫಿಟ್‌ನೆಸ್ ಪಯಣವನ್ನು ಇಲ್ಲಿಂದ ಪ್ರಾರಂಭಿಸಿ. ಮೂಲಭೂತ ಶಕ್ತಿ ಮತ್ತು ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸಗಳನ್ನು ನಿರ್ಮಿಸಿ.",
    tagline: "Build basic fitness and exercise habits.",
    taglineKn: "ಮೂಲಭೂತ ಫಿಟ್‌ನೆಸ್ ಮತ್ತು ವ್ಯಾಯಾಮದ ಅಭ್ಯಾಸಗಳನ್ನು ನಿರ್ಮಿಸಿ.",
    weeks: [
      {
        week: 1,
        schedule: [
          { day: "Monday", activity: "Workout: Core Crusher & Cardio", workoutId: "core-cardio" },
          { day: "Tuesday", activity: "Active Recovery: 20 min Walk", workoutId: null },
          { day: "Wednesday", activity: "Workout: Core Crusher & Cardio", workoutId: "core-cardio" },
          { day: "Thursday", activity: "Rest Day", workoutId: null },
          { day: "Friday", activity: "Workout: Chest & Triceps Focus", workoutId: "chest-triceps" },
          { day: "Saturday", activity: "Rest Day", workoutId: null },
          { day: "Sunday", activity: "Active Recovery: Stretch Routine", workoutId: null }
        ]
      }
    ]
  }
];

export const DEFAULT_USER = {
  name: "Sachin",
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
  activeProgramId: "pcod-pcos-hormonal",
  activeProgramWeek: 1,
  language: "en"
};
