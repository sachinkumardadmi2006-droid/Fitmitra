import React, { useState, useEffect, useRef } from 'react';
import { Apple, Plus, Trash2, Clock, Check, ChevronRight, X, Heart, Search, Lock, Bell, CheckCircle } from 'lucide-react';
import { 
  getUser, 
  getTodayNutritionLogs, 
  addNutritionLog, 
  deleteNutritionLog,
  saveUser
} from '../utils/db';
import { RECIPES } from '../data/mockData';
import { t } from '../utils/i18n';

// Mock expired recipes dataset
const EXPIRED_RECIPES = [
  {
    id: "expired-shake",
    name: "Summer Mango Protein Shake",
    nameKn: "ಬೇಸಿಗೆ ಮಾವಿನ ಪ್ರೋಟೀನ್ ಶೇಕ್",
    category: "Snacks",
    calories: 280,
    protein: 25,
    carbs: 35,
    fats: 4,
    prepTime: 5,
    cookTime: 0,
    imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      "1 cup Sweet Mango pulp",
      "1 scoop Vanilla Whey Protein",
      "1 cup Almond Milk",
      "Ice cubes"
    ],
    preparation: [
      "Combine all ingredients in a blender.",
      "Blend on high until completely smooth.",
      "Pour into a chilled glass and serve immediately."
    ],
    isExpired: true
  }
];

function Nutrition() {
  const [user, setUser] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  
  // Recipe drawer states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [targetMealType, setTargetMealType] = useState('Breakfast');

  // Search recipes
  const [recipeSearch, setRecipeSearch] = useState('');

  // Drawer scroll reset ref
  const drawerRef = useRef(null);

  useEffect(() => {
    if (drawerRef.current && selectedRecipe) {
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedRecipe]);

  // Learn tab states
  const [activeTab, setActiveTab] = useState('All');
  const [inProgressIds, setInProgressIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fitmitra_in_progress_recipes')) || [];
    } catch (e) {
      return [];
    }
  });

  // Premium Payment Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const loadNutritionData = () => {
    setUser(getUser());
    setTodayLogs(getTodayNutritionLogs());
  };

  useEffect(() => {
    loadNutritionData();
    window.addEventListener('fitmitra_db_update', loadNutritionData);
    return () => window.removeEventListener('fitmitra_db_update', loadNutritionData);
  }, []);

  useEffect(() => {
    localStorage.setItem('fitmitra_in_progress_recipes', JSON.stringify(inProgressIds));
  }, [inProgressIds]);

  const handleUpgradeClick = () => {
    setShowPaymentModal(true);
  };

  const handleProceedPayment = (e) => {
    e.preventDefault();
    setPaymentProcessing(true);

    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        const updated = {
          ...user,
          isPremium: true
        };
        saveUser(updated);
        setUser(updated);
        
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setUpiId('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardName('');
      }, 1500);
    }, 2000);
  };

  const handleAddMeal = (recipe, mealType) => {
    const mealCategory = mealType || targetMealType;
    addNutritionLog({
      mealType: mealCategory,
      name: lang === 'kn' && recipe.nameKn ? recipe.nameKn : recipe.name,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fats: recipe.fats
    });
    // Remove from in-progress list once logged
    setInProgressIds(prev => prev.filter(id => id !== recipe.id));
    setDrawerOpen(false);
  };

  const handleDeleteLog = (id) => {
    deleteNutritionLog(id);
  };

  const openRecipeDetails = (recipe, defaultMealType) => {
    setSelectedRecipe(recipe);
    setTargetMealType(defaultMealType || recipe.category);
    setDrawerOpen(true);

    // Add to in progress if not already completed/logged and not already in progress
    const isLogged = todayLogs.some(log => log.name === recipe.name || log.name === recipe.nameKn);
    if (!isLogged && !recipe.isExpired && !inProgressIds.includes(recipe.id)) {
      setInProgressIds(prev => [...prev, recipe.id]);
    }
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading nutrition...</div>;

  const lang = user.language || 'en';

  // Calculate totals
  const totalCalories = todayLogs.reduce((acc, l) => acc + l.calories, 0);
  const totalProtein = todayLogs.reduce((acc, l) => acc + (l.protein || 0), 0);
  const totalCarbs = todayLogs.reduce((acc, l) => acc + (l.carbs || 0), 0);
  const totalFats = todayLogs.reduce((acc, l) => acc + (l.fats || 0), 0);

  // Group logs by mealType
  const meals = {
    Breakfast: todayLogs.filter(l => l.mealType === 'Breakfast'),
    Lunch: todayLogs.filter(l => l.mealType === 'Lunch'),
    Dinner: todayLogs.filter(l => l.mealType === 'Dinner'),
    Snacks: todayLogs.filter(l => l.mealType === 'Snacks'),
  };

  // Get recipes based on active tab and search query
  const getTabRecipes = () => {
    const taggedRecipes = RECIPES.map(recipe => {
      const isLocked = !user.isPremium && (recipe.id === 'salmon-potato' || recipe.id === 'jolada-roti');
      const freePreview = recipe.id === 'ragi-mudde' || recipe.id === 'paneer-salad' || recipe.id === 'protein-oats';
      const isNew = recipe.id === 'salmon-potato' || recipe.id === 'ragi-mudde' || recipe.id === 'idli-sambar';
      return {
        ...recipe,
        isLocked,
        freePreview,
        isNew
      };
    });

    if (activeTab === 'All') {
      return taggedRecipes;
    }
    if (activeTab === 'In Progress') {
      return taggedRecipes.filter(r => inProgressIds.includes(r.id));
    }
    if (activeTab === 'Completed') {
      return taggedRecipes.filter(r => 
        todayLogs.some(log => log.name === r.name || log.name === r.nameKn)
      );
    }
    if (activeTab === 'Expired') {
      return EXPIRED_RECIPES.map(r => ({ ...r, isLocked: false, freePreview: false, isNew: false }));
    }
    return taggedRecipes;
  };

  const filteredRecipes = getTabRecipes().filter(r => {
    const searchLower = recipeSearch.toLowerCase();
    const nameMatch = r.name.toLowerCase().includes(searchLower) || 
                      (r.nameKn && r.nameKn.toLowerCase().includes(searchLower));
    const categoryMatch = r.category.toLowerCase().includes(searchLower);
    return nameMatch || categoryMatch;
  });

  const getMealTypeLabel = (mt) => {
    if (lang === 'kn') {
      if (mt === 'Breakfast') return 'ಬೆಳಗಿನ ಉಪಹಾರ';
      if (mt === 'Lunch') return 'ಮಧ್ಯಾಹ್ನದ ಊಟ';
      if (mt === 'Dinner') return 'ರಾತ್ರಿಯ ಊಟ';
      if (mt === 'Snacks') return 'ತಿಂಡಿ / ತಿನಿಸುಗಳು';
    }
    return mt;
  };

  return (
    <div className="nutrition-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient">{t('nutritionLogger', lang)}</h1>
          <p className="page-subtitle">{t('trackYourDailyMeals', lang)}</p>
        </div>
      </div>

      {/* Calorie Macro Ring Summary */}
      <div className="glass-card summary-card" style={{ marginBottom: '30px' }}>
        <h2 className="widget-title">{lang === 'kn' ? 'ದೈನಂದಿನ ಶಕ್ತಿಯ ಸಮತೋಲನ' : 'Daily Energy Balance'}</h2>
        
        <div className="diet-summary-flex">
          {/* Calorie Stats */}
          <div className="cal-stats">
            <div className="cal-item">
              <span className="label">{lang === 'kn' ? 'ಗುರಿ ಮಿತಿ' : 'Target Limit'}</span>
              <strong>{user.targetCal} kcal</strong>
            </div>
            <div className="cal-divider">-</div>
            <div className="cal-item">
              <span className="label">{lang === 'kn' ? 'ಸೇವನೆ' : 'Consumed'}</span>
              <strong>{totalCalories} kcal</strong>
            </div>
            <div className="cal-divider">=</div>
            <div className="cal-item">
              <span className="label">{lang === 'kn' ? 'ಉಳಿದಿರುವುದು' : 'Remaining'}</span>
              <strong style={{ color: user.targetCal - totalCalories >= 0 ? 'var(--primary-neon)' : 'var(--accent-rose)' }}>
                {user.targetCal - totalCalories} kcal
              </strong>
            </div>
          </div>

          {/* Macro Progress list */}
          <div className="macro-progress-bars">
            <div className="macro-bar-item">
              <div className="label-row">
                <span>{lang === 'kn' ? 'ಪ್ರೋಟೀನ್' : 'Protein'}</span>
                <strong>{totalProtein}g / {user.targetProtein}g</strong>
              </div>
              <div className="bar-bg"><div className="bar-fill fill-neon" style={{ width: `${Math.min(100, (totalProtein / user.targetProtein) * 100)}%` }}></div></div>
            </div>

            <div className="macro-bar-item">
              <div className="label-row">
                <span>{lang === 'kn' ? 'ಕಾರ್ಬ್ಸ್' : 'Carbs'}</span>
                <strong>{totalCarbs}g / {user.targetCarbs}g</strong>
              </div>
              <div className="bar-bg"><div className="bar-fill fill-cyan" style={{ width: `${Math.min(100, (totalCarbs / user.targetCarbs) * 100)}%` }}></div></div>
            </div>

            <div className="macro-bar-item">
              <div className="label-row">
                <span>{lang === 'kn' ? 'ಕೊಬ್ಬು' : 'Fats'}</span>
                <strong>{totalFats}g / {user.targetFats}g</strong>
              </div>
              <div className="bar-bg"><div className="bar-fill fill-orange" style={{ width: `${Math.min(100, (totalFats / user.targetFats) * 100)}%` }}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="nutrition-grid-split">
        {/* Left Column: Meal Logs */}
        <div className="meals-column">
          <h2 className="column-title">{lang === 'kn' ? 'ಇಂದಿನ ಆಹಾರ ಯೋಜನೆ' : "Today's Meal Plan"}</h2>
          
          {Object.keys(meals).map((mealType) => (
            <div key={mealType} className="glass-card meal-type-section" style={{ marginBottom: '16px', padding: '16px' }}>
              <div className="meal-section-header">
                <div className="title-wrap">
                  <Apple size={18} className="meal-icon" />
                  <h3>{getMealTypeLabel(mealType)}</h3>
                </div>
                <span className="meal-type-calories">
                  {meals[mealType].reduce((acc, curr) => acc + curr.calories, 0)} Kcal
                </span>
              </div>

              <div className="logged-foods-list">
                {meals[mealType].map((log) => (
                  <div key={log.id} className="logged-food-row">
                    <div className="food-details">
                      <p className="food-name">{log.name}</p>
                      <p className="food-macros">P: {log.protein}g • C: {log.carbs}g • F: {log.fats}g</p>
                    </div>
                    <div className="food-actions">
                      <span className="cal">{log.calories} Kcal</span>
                      <button className="delete-btn" onClick={() => handleDeleteLog(log.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {meals[mealType].length === 0 && (
                  <p className="no-foods-placeholder">{lang === 'kn' ? `${getMealTypeLabel(mealType)} ಗಾಗಿ ಯಾವುದೇ ಆಹಾರ ದಾಖಲಿಸಿಲ್ಲ.` : `No foods logged for ${mealType}.`}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Recipe Explorer / Learn Page Layout */}
        <div className="recipes-column learn-layout">
          <div className="learn-header-container">
            <h2 className="learn-title">{lang === 'kn' ? 'ಕಲಿಯಿರಿ' : 'Learn'}</h2>
            <div className="header-icons">
              <Search className="header-icon" size={20} />
              <Bell className="header-icon" size={20} />
              <div className="avatar-circle">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          {/* Scrollable Category Pill Tabs */}
          <div className="learn-tabs-scroll-row">
            {['All', 'In Progress', 'Completed', 'Expired'].map(tab => (
              <button 
                key={tab} 
                className={`learn-tab-pill ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {lang === 'kn' ? (
                  tab === 'All' ? 'ಎಲ್ಲವೂ' :
                  tab === 'In Progress' ? 'ಪ್ರಗತಿಯಲ್ಲಿದೆ' :
                  tab === 'Completed' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'ಅವಧಿ ಮುಗಿದಿದೆ'
                ) : tab}
              </button>
            ))}
          </div>

          <div className="recipe-search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder={lang === 'kn' ? 'ಆಹಾರ ವಿಧಾನಗಳನ್ನು ಹುಡುಕಿ...' : 'Search recipes...'}
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
            />
          </div>

          <div className="recipes-cards-list">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id}>
                {/* Recipe Card */}
                <div className={`learn-recipe-card ${drawerOpen && selectedRecipe?.id === recipe.id ? 'card-active' : ''}`}>
                  <div className="card-image-container">
                    <img src={recipe.imageUrl} alt={recipe.name} />
                    {recipe.isLocked && (
                      <div className="lock-overlay">
                        <div className="lock-circle">
                          <Lock size={20} fill="#FFFFFF" color="#FFFFFF" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-details-container">
                    <div className="badges-row">
                      {recipe.freePreview && <span className="badge-pill free-preview">FREE PREVIEW</span>}
                      {recipe.isNew && <span className="badge-pill new-badge">NEW</span>}
                    </div>
                    
                    <h3 className="card-title">{lang === 'kn' && recipe.nameKn ? recipe.nameKn : recipe.name}</h3>
                    <p className="card-subtitle">{lang === 'kn' ? 'ಫಿಟ್‌ಮಿತ್ರ ಹೆಲ್ತ್ ಅಂಡ್ ಫಿಟ್‌ನೆಸ್' : 'FitMitra Health And Fitness'}</p>
                    
                    <p className="card-lectures-text">
                      {recipe.isExpired 
                        ? (lang === 'kn' ? 'ಅವಧಿ ಮುಗಿದಿದೆ - ಬೇಸಿಗೆಯಲ್ಲಿ ಲಭ್ಯವಿರುತ್ತದೆ' : 'Expired - Available in Summer') 
                        : `${recipe.preparation ? recipe.preparation.length : 5} steps • ${recipe.ingredients ? recipe.ingredients.length : 6} ingredients`
                      }
                    </p>
                    
                    {recipe.isLocked ? (
                      <button className="unlock-action-btn" onClick={handleUpgradeClick}>
                        Buy now to unlock
                      </button>
                    ) : recipe.isExpired ? (
                      <button className="unlock-action-btn expired-btn" disabled>
                        {lang === 'kn' ? 'ಲಭ್ಯವಿಲ್ಲ' : 'Unavailable'}
                      </button>
                    ) : (
                      <button 
                        className="view-action-btn" 
                        onClick={() => {
                          if (drawerOpen && selectedRecipe?.id === recipe.id) {
                            setDrawerOpen(false);
                          } else {
                            openRecipeDetails(recipe, recipe.category);
                          }
                        }}
                      >
                        {drawerOpen && selectedRecipe?.id === recipe.id ? 'Close Details' : 'View Recipe & Log Meal'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Expanded Detail (appears right below this card) */}
                {drawerOpen && selectedRecipe?.id === recipe.id && (
                  <div ref={drawerRef} className="inline-recipe-detail animate-fade-in">
                    {/* Hero Image */}
                    <div className="overlay-hero-image">
                      <img src={selectedRecipe.imageUrl} alt={selectedRecipe.name} />
                      <span className="overlay-category-badge">{selectedRecipe.category}</span>
                      <button className="overlay-close-btn" onClick={() => setDrawerOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>

                    {/* Detail Body */}
                    <div className="overlay-card-body">
                      <h2 className="overlay-recipe-title">
                        {lang === 'kn' && selectedRecipe.nameKn ? selectedRecipe.nameKn : selectedRecipe.name}
                      </h2>

                      {/* Cooking Time Row */}
                      <div className="overlay-time-row">
                        <div className="time-chip">
                          <Clock size={14} />
                          <span>Prep: {selectedRecipe.prepTime}m</span>
                        </div>
                        <div className="time-chip">
                          <Clock size={14} />
                          <span>Cook: {selectedRecipe.cookTime}m</span>
                        </div>
                        <div className="time-chip total-time">
                          <Clock size={14} />
                          <span>Total: {selectedRecipe.prepTime + selectedRecipe.cookTime}m</span>
                        </div>
                      </div>

                      {/* Macros Grid */}
                      <div className="overlay-macros-grid">
                        <div className="overlay-macro-item">
                          <strong>{selectedRecipe.calories}</strong>
                          <span>Calories</span>
                        </div>
                        <div className="overlay-macro-item">
                          <strong>{selectedRecipe.protein}g</strong>
                          <span>Protein</span>
                        </div>
                        <div className="overlay-macro-item">
                          <strong>{selectedRecipe.carbs}g</strong>
                          <span>Carbs</span>
                        </div>
                        <div className="overlay-macro-item">
                          <strong>{selectedRecipe.fats}g</strong>
                          <span>Fats</span>
                        </div>
                      </div>

                      {/* Add to Meal Plan Action */}
                      <div className="overlay-log-action">
                        <select 
                          className="form-control overlay-select" 
                          value={targetMealType}
                          onChange={(e) => setTargetMealType(e.target.value)}
                        >
                          <option value="Breakfast">{lang === 'kn' ? 'ಬೆಳಗಿನ ಉಪಹಾರ' : 'Breakfast'}</option>
                          <option value="Lunch">{lang === 'kn' ? 'ಮಧ್ಯಾಹ್ನದ ಊಟ' : 'Lunch'}</option>
                          <option value="Dinner">{lang === 'kn' ? 'ರಾತ್ರಿಯ ಊಟ' : 'Dinner'}</option>
                          <option value="Snacks">{lang === 'kn' ? 'ತಿಂಡಿ' : 'Snacks'}</option>
                        </select>
                        <button 
                          onClick={() => handleAddMeal(selectedRecipe)} 
                          className="btn btn-primary overlay-add-btn"
                        >
                          <Plus size={16} />
                          {lang === 'kn' ? 'ಊಟಕ್ಕೆ ಸೇರಿಸಿ' : 'ADD TO MEAL PLAN'}
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="overlay-divider"></div>

                      {/* Ingredients */}
                      <div className="overlay-section">
                        <h3 className="overlay-section-title">
                          🧾 {lang === 'kn' ? 'ಪದಾರ್ಥಗಳು' : 'Ingredients'}
                        </h3>
                        <ul className="overlay-ingredients-list">
                          {selectedRecipe.ingredients.map((ing, i) => (
                            <li key={i}>
                              <Check size={14} className="ing-check" />
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Divider */}
                      <div className="overlay-divider"></div>

                      {/* Preparation Steps */}
                      <div className="overlay-section">
                        <h3 className="overlay-section-title">
                          👨‍🍳 {lang === 'kn' ? 'ತಯಾರಿಸುವ ವಿಧಾನ' : 'Preparation Steps'}
                        </h3>
                        <ol className="overlay-steps-list">
                          {selectedRecipe.preparation.map((step, i) => (
                            <li key={i}>
                              <div className="step-number">{i + 1}</div>
                              <p>{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredRecipes.length === 0 && (
              <div className="empty-tab-state text-center" style={{ padding: '40px 20px', color: 'var(--text-muted)' }}>
                <p className="empty-text">
                  {activeTab === 'In Progress' 
                    ? (lang === 'kn' ? 'ಯಾವುದೇ ಆಹಾರ ವಿಧಾನಗಳು ಪ್ರಗತಿಯಲ್ಲಿಲ್ಲ.' : "No recipes in progress. Tap 'View Recipe' on any recipe to start!") 
                    : activeTab === 'Completed'
                    ? (lang === 'kn' ? 'ಇಂದು ಯಾವುದೇ ಆಹಾರ ದಾಖಲಿಸಿಲ್ಲ.' : 'No recipes completed/logged today. Log a recipe to view it here!') 
                    : activeTab === 'Expired'
                    ? (lang === 'kn' ? 'ಯಾವುದೇ ಅವಧಿ ಮುಗಿದ ಆಹಾರ ವಿಧಾನಗಳಿಲ್ಲ.' : 'No expired recipes. Keep eating fresh and healthy!')
                    : (lang === 'kn' ? 'ಯಾವುದೇ ಆಹಾರ ವಿಧಾನಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No recipes found matching your search.')
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Upgrade Modal */}
      {showPaymentModal && (
        <div className="payment-modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="payment-modal-content glass-card animate-fade-in">
            <button className="payment-modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            
            {paymentSuccess ? (
              <div className="payment-success-state text-center">
                <div className="success-checkmark-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={48} className="success-checkmark-icon" style={{ color: '#10b981' }} />
                </div>
                <h2>{lang === 'kn' ? 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ! 🎉' : 'Payment Successful! 🎉'}</h2>
                <p>{lang === 'kn' ? 'ಫಿಟ್‌ಮಿತ್ರ ಪ್ರೊ ಗೆ ಸುಸ್ವಾಗತ!' : 'Welcome to FitMitra Pro!'}</p>
                <p className="sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರೊ ಪ್ರವೇಶ ಸಕ್ರಿಯಗೊಂಡಿದೆ.' : 'Your Pro features are now fully unlocked.'}
                </p>
              </div>
            ) : paymentProcessing ? (
              <div className="payment-processing-state text-center" style={{ padding: '40px 20px' }}>
                <div className="payment-spinner"></div>
                <h2>{lang === 'kn' ? 'ಸುರಕ್ಷಿತ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ...' : 'Secure Payment processing...'}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'kn' ? 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ, ನಿಮ್ಮ ವಹಿವಾಟನ್ನು ಅಧಿಕೃತಗೊಳಿಸಲಾಗುತ್ತಿದೆ.' : 'Please wait, authorizing transaction securely with bank gateways.'}
                </p>
              </div>
            ) : (
              <div>
                <div className="payment-modal-header" style={{ marginBottom: '20px', textAlign: 'left' }}>
                  <h3 style={{ color: 'var(--secondary-cyan)', textShadow: '0 0 10px rgba(0, 240, 255, 0.2)', fontSize: '1.25rem', marginBottom: '4px' }}>
                    {lang === 'kn' ? 'ಫಿಟ್‌ಮಿತ್ರ ಪ್ರೊ ಸುರಕ್ಷಿತ ಪಾವತಿ' : 'FitMitra Pro Secure Checkout'}
                  </h3>
                  <p className="desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {lang === 'kn' ? 'ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ರದ್ದುಗೊಳಿಸಬಹುದಾದ ಪ್ರೊ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ' : 'Unlock advanced workouts, diets, and AI recommendations'}
                  </p>
                </div>

                <form onSubmit={handleProceedPayment}>
                  {/* Plan Selector Grid */}
                  <div className="payment-plan-selector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div 
                      className={`payment-plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan('monthly')}
                      style={{ cursor: 'pointer', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.01)' }}
                    >
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlan === 'monthly'} 
                        onChange={() => setSelectedPlan('monthly')} 
                        id="plan-monthly"
                      />
                      <div className="details" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {lang === 'kn' ? 'ಮಾಸಿಕ ಯೋಜನೆ' : 'Monthly Plan'}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {lang === 'kn' ? '₹799 / ತಿಂಗಳಿಗೆ' : '₹799 / month'}
                        </span>
                      </div>
                    </div>

                    <div 
                      className={`payment-plan-card ${selectedPlan === 'annual' ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan('annual')}
                      style={{ cursor: 'pointer', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.01)' }}
                    >
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlan === 'annual'} 
                        onChange={() => setSelectedPlan('annual')} 
                        id="plan-annual"
                      />
                      <div className="details" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {lang === 'kn' ? 'ವಾರ್ಷಿಕ ಯೋಜನೆ' : 'Annual Plan'}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {lang === 'kn' ? '₹4,999 / ವರ್ಷಕ್ಕೆ' : '₹4,999 / year'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="payment-methods-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '16px' }}>
                    {['upi', 'card', 'netbanking'].map(method => (
                      <button 
                        key={method}
                        type="button"
                        className={`method-tab ${paymentMethod === method ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(method)}
                        style={{ flex: 1, background: 'none', border: 'none', borderBottom: '2px solid transparent', color: paymentMethod === method ? 'var(--secondary-cyan)' : 'var(--text-secondary)', borderBottomColor: paymentMethod === method ? 'var(--secondary-cyan)' : 'transparent', fontWeight: '600', padding: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        {method === 'upi' ? 'UPI' : method === 'card' ? (lang === 'kn' ? 'ಕಾರ್ಡ್' : 'Card') : (lang === 'kn' ? 'ನೆಟ್ ಬ್ಯಾಂಕ್' : 'Netbanking')}
                      </button>
                    ))}
                  </div>

                  {/* Payment Inputs based on selected method */}
                  <div className="payment-method-fields-container" style={{ minHeight: '110px', marginBottom: '20px' }}>
                    {paymentMethod === 'upi' && (
                      <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          {lang === 'kn' ? 'ಯುಪಿಐ ಐಡಿ ನಮೂದಿಸಿ' : 'Enter UPI ID'}
                        </label>
                        <input 
                          type="text" 
                          required
                          className="form-control" 
                          placeholder="username@okaxis or username@upi" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                        <span className="field-note" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                          {lang === 'kn' ? 'ಪಾವತಿ ವಿನಂತಿಯನ್ನು ನಿಮ್ಮ ಯುಪಿಐ ಆಪ್ ನಲ್ಲಿ ದೃಢೀಕರಿಸಿ.' : 'A payment request will be sent to your UPI app.'}
                        </span>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="card-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                        <div className="form-group span-2" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            {lang === 'kn' ? 'ಕಾರ್ಡ್ ಸಂಖ್ಯೆ' : 'Card Number'}
                          </label>
                          <input 
                            type="text" 
                            required
                            className="form-control" 
                            placeholder="4111 2222 3333 4444" 
                            maxLength="19"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            {lang === 'kn' ? 'ಅವಧಿ ಮುಗಿಯುವ ದಿನಾಂಕ' : 'Expiry'}
                          </label>
                          <input 
                            type="text" 
                            required
                            className="form-control" 
                            placeholder="MM / YY" 
                            maxLength="7"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CVV</label>
                          <input 
                            type="password" 
                            required
                            className="form-control" 
                            placeholder="•••" 
                            maxLength="3"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                        <div className="form-group span-2" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            {lang === 'kn' ? 'ಕಾರ್ಡ್‌ನಲ್ಲಿರುವ ಹೆಸರು' : 'Name on Card'}
                          </label>
                          <input 
                            type="text" 
                            required
                            className="form-control" 
                            placeholder="John Doe" 
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          {lang === 'kn' ? 'ಬ್ಯಾಂಕ್ ಆಯ್ಕೆಮಾಡಿ' : 'Select Bank'}
                        </label>
                        <select className="form-control" style={{ width: '100%', height: '40px', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0 10px' }}>
                          <option>State Bank of India</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-cyan btn-block btn-payment-action glow-cyan"
                    style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '700', borderRadius: '10px' }}
                  >
                    {lang === 'kn' 
                      ? `ಸುರಕ್ಷಿತವಾಗಿ ಪಾವತಿಸಿ ${selectedPlan === 'monthly' ? '₹799' : '₹4,999'}` 
                      : `PAY ${selectedPlan === 'monthly' ? '₹799' : '₹4,999'} SECURELY`
                    }
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .widget-title {
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .column-title {
          font-size: 1.4rem;
          margin-bottom: 8px;
          text-align: left;
        }

        .sub-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
          text-align: left;
        }

        /* Energy balance row */
        .diet-summary-flex {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .diet-summary-flex {
            flex-direction: row;
            align-items: center;
          }
        }

        .cal-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        @media (max-width: 480px) {
          .cal-stats {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        .cal-item {
          text-align: center;
        }

        .cal-item .label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .cal-item strong {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
        }

        .cal-divider {
          font-size: 1.2rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .macro-progress-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 320px;
        }

        .macro-bar-item .label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }

        .macro-bar-item span {
          color: var(--text-secondary);
        }

        .macro-bar-item strong {
          color: var(--text-primary);
        }

        .bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 999px;
        }

        .fill-neon { background: var(--primary-neon); }
        .fill-cyan { background: var(--secondary-cyan); }
        .fill-orange { background: var(--accent-orange); }

        /* Split layouts */
        .nutrition-grid-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .nutrition-grid-split {
            grid-template-columns: 1.2fr 1fr;
          }
        }

        /* Meal categories lists */
        .meal-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .meal-section-header .title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .meal-section-header h3 {
          font-size: 1.05rem;
          font-weight: 600;
        }

        .meal-icon {
          color: var(--primary-neon);
        }

        .meal-type-calories {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--secondary-cyan);
        }

        .logged-foods-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .logged-food-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: var(--border-radius-sm);
        }

        .food-details {
          text-align: left;
        }

        .food-name {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .food-macros {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .food-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .food-actions .cal {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
        }

        .delete-btn:hover {
          color: var(--accent-rose);
        }

        .no-foods-placeholder {
          font-size: 0.8rem;
          color: var(--text-muted);
          padding: 8px 0;
          text-align: left;
        }

        /* Recipe explorer sidebar */
        .recipe-search-wrapper {
          position: relative;
          margin-bottom: 16px;
        }

        .recipe-search-wrapper .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .recipe-search-wrapper input {
          padding-left: 40px;
        }

        .recipes-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recipe-list-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
        }

        .recipe-thumbnail {
          width: 50px;
          height: 50px;
          border-radius: var(--border-radius-sm);
          object-fit: cover;
          border: 1px solid var(--border-glass);
        }

        .recipe-row-info {
          flex: 1;
          text-align: left;
        }

        .recipe-cat-badge {
          font-size: 0.65rem;
          color: var(--secondary-cyan);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .recipe-row-info h3 {
          font-size: 0.95rem;
          margin: 2px 0;
        }

        .recipe-row-info .meta {
          display: flex;
          gap: 10px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .arrow-icon {
          color: var(--text-muted);
        }

        .recipe-list-row:hover .arrow-icon {
          color: var(--primary-neon);
        }

        /* === Swiggy Instamart-style Inline Detail Card === */
        .learn-recipe-card.card-active {
          border-color: var(--primary-neon);
          box-shadow: 0 0 16px rgba(204, 255, 0, 0.15);
        }

        .inline-recipe-detail {
          position: relative;
          width: 100%;
          background: #111827;
          border: 1px solid var(--border-glass-bright);
          border-radius: 0 0 16px 16px;
          margin-top: -8px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.04);
        }

        .overlay-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .overlay-close-btn:hover {
          background: rgba(244, 63, 94, 0.8);
          border-color: rgba(244, 63, 94, 0.8);
          transform: scale(1.1);
        }

        .overlay-hero-image {
          position: relative;
          width: 100%;
          height: 220px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .overlay-hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-category-badge {
          position: absolute;
          bottom: 12px;
          left: 16px;
          background: var(--primary-neon);
          color: #000;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 5px 14px;
          border-radius: 20px;
        }

        .overlay-card-body {
          padding: 20px 24px 28px;
          overflow-y: auto;
          flex: 1;
          text-align: left;
        }

        .overlay-recipe-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
          line-height: 1.3;
        }

        /* Time chips row */
        .overlay-time-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .time-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-glass);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .time-chip.total-time {
          border-color: rgba(204, 255, 0, 0.2);
          color: var(--primary-neon);
        }

        /* Macros grid */
        .overlay-macros-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: 14px;
          padding: 14px 8px;
          margin-bottom: 20px;
        }

        .overlay-macro-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .overlay-macro-item strong {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          color: var(--primary-neon);
        }

        .overlay-macro-item span {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Add to meal plan action row */
        .overlay-log-action {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .overlay-select {
          flex: 0 0 140px;
          height: 42px;
          border-radius: 10px;
          font-size: 0.85rem;
        }

        .overlay-add-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 42px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        /* Divider */
        .overlay-divider {
          height: 1px;
          background: var(--border-glass);
          margin: 4px 0 16px;
        }

        /* Section styling */
        .overlay-section {
          margin-bottom: 16px;
        }

        .overlay-section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        /* Ingredients list with checkmarks */
        .overlay-ingredients-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .overlay-ingredients-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 12px;
          margin-bottom: 4px;
          border-radius: 10px;
          font-size: 0.88rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: background 0.15s;
        }

        .overlay-ingredients-list li:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .ing-check {
          color: var(--primary-neon);
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Preparation steps with numbered circles */
        .overlay-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          counter-reset: none;
        }

        .overlay-steps-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .step-number {
          width: 28px;
          height: 28px;
          min-width: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary-cyan), var(--primary-neon));
          color: #000;
          font-weight: 800;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .overlay-steps-list p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 560px) {
          .recipe-overlay-card {
            max-width: 100%;
            max-height: 95vh;
            border-radius: 16px;
          }

          .overlay-hero-image {
            height: 180px;
          }

          .overlay-log-action {
            flex-direction: column;
          }

          .overlay-select {
            flex: unset;
            width: 100%;
          }
        }

        /* --- Learn Page Layout & Recipes Cards --- */
        .learn-layout {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .learn-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .learn-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .header-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s;
        }

        .header-icon:hover {
          color: var(--primary-neon);
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary-cyan), var(--primary-neon));
          color: #000;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.2);
        }

        .learn-tabs-scroll-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin-bottom: 20px;
          padding-bottom: 4px;
          scrollbar-width: none; /* Hide scrollbar Firefox */
        }

        .learn-tabs-scroll-row::-webkit-scrollbar {
          display: none; /* Hide scrollbar Chrome/Safari */
        }

        .learn-tab-pill {
          background: transparent;
          border: 1.5px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .learn-tab-pill:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
        }

        .learn-tab-pill.active {
          border-color: #D4AF37;
          color: #D4AF37;
          background: rgba(212, 175, 55, 0.05);
        }

        .recipes-cards-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .learn-recipe-card {
          background: var(--bg-dark-card);
          border: 1px solid var(--border-glass);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--shadow-dark);
          transition: transform 0.2s, border-color 0.2s;
        }

        .learn-recipe-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-glass-bright);
        }

        .card-image-container {
          position: relative;
          height: 160px;
          width: 100%;
          overflow: hidden;
        }

        .card-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lock-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #F4D024;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1A202C;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .card-details-container {
          padding: 16px;
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .badges-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .badge-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }

        .free-preview {
          background: #22C55E;
          color: #FFFFFF;
        }

        .new-badge {
          background: #EFC31A;
          color: #000000;
        }

        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .card-lectures-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .unlock-action-btn {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: none;
          background: #2D3748;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .unlock-action-btn:hover {
          background: #3a475c;
        }

        .unlock-action-btn.expired-btn {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .view-action-btn {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: 1.5px solid var(--primary-neon);
          background: transparent;
          color: var(--primary-neon);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-action-btn:hover {
          background: var(--primary-neon);
          color: #000000;
          box-shadow: var(--shadow-neon);
        }

        /* --- Payment Modal Styles --- */
        .payment-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 7, 20, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 16px;
        }

        .payment-modal-content {
          width: 100%;
          max-width: 480px;
          position: relative;
          padding: 24px;
          border: 1px solid var(--border-glass-bright);
          background: var(--bg-dark-card);
          border-radius: var(--border-radius-lg);
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        }

        .payment-modal-close {
          position: absolute;
          top: 14px;
          right: 18px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.8rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .payment-modal-close:hover {
          color: var(--accent-rose);
        }

        .payment-plan-card:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(0, 240, 255, 0.3);
        }

        .payment-plan-card.selected {
          border-color: var(--secondary-cyan) !important;
          background: rgba(0, 240, 255, 0.05) !important;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.1);
        }

        .payment-plan-card input[type="radio"] {
          margin-top: 3px;
        }

        .payment-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 240, 255, 0.1);
          border-radius: 50%;
          border-top-color: var(--secondary-cyan);
          animation: spin 1s ease-in-out infinite;
          margin: 0 auto 24px;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
        }

        .success-checkmark-wrapper {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Nutrition;
