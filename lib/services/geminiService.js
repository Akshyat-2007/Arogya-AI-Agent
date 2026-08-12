import { GoogleGenerativeAI } from '@google/generative-ai';
import { Config } from '../config';

class GeminiService {
  constructor() {
    this.apiConfigured = false;
    this.genAI = null;
    this.configureApi();
  }

  configureApi() {
    const apiKey = Config.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.apiConfigured = true;
        console.log('Gemini API successfully configured.');
      } catch (e) {
        console.error('Error configuring Gemini API:', e);
        this.apiConfigured = false;
      }
    } else {
      console.warn('Gemini API Key is not set or is still the default placeholder.');
      this.apiConfigured = false;
    }
  }

  _getModel(systemInstruction = null, jsonMode = false) {
    if (!this.apiConfigured) {
      this.configureApi();
    }

    const generationConfig = {};
    if (jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    let instructions = Config.AGENT_INSTRUCTIONS;
    if (systemInstruction) {
      instructions += `\n\nAdditional Instructions:\n${systemInstruction}`;
    }

    return this.genAI.getGenerativeModel({
      model: Config.GEMINI_MODEL,
      generationConfig,
      systemInstruction: instructions
    });
  }

  async getChatResponse(member, chatHistory, userMessage) {
    if (!this.apiConfigured) {
      return '⚠️ Gemini API key is missing or invalid. Please configure your `.env` file with a valid `GOOGLE_API_KEY`.';
    }

    try {
      const bmiCategory = member.bmi_category;
      const targetMacros = member.target_macros;
      const memberContext = 
        `Active Family Member Profile:\n` +
        `- Name: ${member.name}\n` +
        `- Age: ${member.age} years old\n` +
        `- Gender: ${member.gender}\n` +
        `- Height: ${member.height_cm} cm\n` +
        `- Weight: ${member.weight_kg} kg\n` +
        `- BMI: ${member.bmi} (${bmiCategory.label})\n` +
        `- Activity Level: ${member.activity_level.charAt(0).toUpperCase() + member.activity_level.slice(1)}\n` +
        `- Dietary Type: ${member.dietary_type}\n` +
        `- Allergies/Intolerances: ${member.allergies ? member.allergies : 'None'}\n` +
        `- Health Goals: ${member.health_goals}\n` +
        `- Regional Preference: ${member.regional_preference}\n` +
        `- Estimated Calorie Budget: ${member.target_calories} kcal/day\n` +
        `- Target Macros: Protein: ${targetMacros.protein}g, Carbs: ${targetMacros.carbs}g, Fat: ${targetMacros.fat}g\n` +
        `Please tailor your responses to support this specific family member.`;

      const formattedHistory = [];
      
      // Seed with context
      formattedHistory.push({
        role: 'user',
        parts: [{ text: `Hello. Here is my profile info. Please remember it for this session.\n\n${memberContext}` }]
      });
      formattedHistory.push({
        role: 'model',
        parts: [{ text: `Hello! I am Arogya AI, your personal nutrition coach. I have loaded the profile for ${member.name}. I am ready to guide you based on their nutritional targets: ${member.target_calories} calories, and preferred ${member.dietary_type} (${member.regional_preference}) diet. How can I help today?` }]
      });

      // Append past chats
      chatHistory.forEach(chat => {
        const role = chat.sender === 'user' ? 'user' : 'model';
        formattedHistory.push({
          role: role,
          parts: [{ text: chat.message }]
        });
      });

      const model = this._getModel();
      const chatSession = model.startChat({ history: formattedHistory });
      const result = await chatSession.sendMessage(userMessage);
      return result.response.text();

    } catch (e) {
      console.error('Error in Gemini Chat Response:', e);
      return `⚠️ An error occurred while generating a response: ${e.message}`;
    }
  }

  async generateMealPlan(member, planType = 'Daily') {
    if (!this.apiConfigured) {
      return this._generateMockPlan(member, planType, 'Gemini API key is not configured.');
    }

    let dietDesc = `${member.dietary_type} diet`;
    if (member.regional_preference && member.regional_preference !== 'None') {
      dietDesc += ` with ${member.regional_preference} regional preference`;
    }

    const targetMacros = member.target_macros;
    let prompt = 
      `Generate a customized ${planType.toLowerCase()} meal plan for ${member.name}.\n` +
      `Profile details:\n` +
      `- Age: ${member.age}, Gender: ${member.gender}\n` +
      `- Height: ${member.height_cm}cm, Weight: ${member.weight_kg}kg\n` +
      `- Daily Calorie Goal: ${member.target_calories} kcal\n` +
      `- Target Macros: Protein: ${targetMacros.protein}g, Carbs: ${targetMacros.carbs}g, Fat: ${targetMacros.fat}g\n` +
      `- Diet: ${dietDesc}\n` +
      `- Allergies/Intolerances: ${member.allergies ? member.allergies : 'None'}\n` +
      `- Health Goal: ${member.health_goals}\n\n`;

    if (planType.toLowerCase() === 'daily') {
      prompt +=
        `Respond ONLY with a JSON object following this EXACT schema (do not include extra text/formatting outside the JSON):\n` +
        `{\n` +
        `  "calories": 1800,\n` +
        `  "macros": {"protein": 75, "carbs": 240, "fat": 50},\n` +
        `  "meals": {\n` +
        `    "breakfast": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 400, "protein": 15, "carbs": 55, "fat": 10},\n` +
        `    "lunch": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 600, "protein": 25, "carbs": 80, "fat": 15},\n` +
        `    "snacks": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 200, "protein": 8, "carbs": 25, "fat": 6},\n` +
        `    "dinner": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 600, "protein": 27, "carbs": 80, "fat": 14}\n` +
        `  },\n` +
        `  "recommendations": ["Recommendation 1", "Recommendation 2"]\n` +
        `}\n` +
        `Ensure calories, macros, and meals correspond closely to the member's targets. Include authentic Indian ingredients and common household portion sizes.`;
    } else {
      prompt +=
        `Respond ONLY with a JSON object following this EXACT schema (do not include extra text/formatting outside the JSON):\n` +
        `{\n` +
        `  "days": {\n` +
        `    "Monday": {\n` +
        `      "calories": 1800,\n` +
        `      "macros": {"protein": 75, "carbs": 240, "fat": 50},\n` +
        `      "meals": {\n` +
        `        "breakfast": {"title": "Meal title", "ingredients": "Ingredients", "calories": 400},\n` +
        `        "lunch": {"title": "Meal title", "ingredients": "Ingredients", "calories": 600},\n` +
        `        "snacks": {"title": "Meal title", "ingredients": "Ingredients", "calories": 200},\n` +
        `        "dinner": {"title": "Meal title", "ingredients": "Ingredients", "calories": 600}\n` +
        `      }\n` +
        `    },\n` +
        `    "Tuesday": { ... (repeat for all days of the week: Monday through Sunday) ... }\n` +
        `  },\n` +
        `  "recommendations": ["Recommendation 1", "Recommendation 2"]\n` +
        `}\n` +
        `Make sure all 7 days of the week are covered with varied, nutritionally dense Indian meals that align with the user's requirements.`;
    }

    try {
      const model = this._getModel(
        'You are a strict JSON generator. You output only valid JSON matching the exact schema requested.',
        true
      );
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Error generating meal plan from Gemini:', e);
      return this._generateMockPlan(member, planType, e.message);
    }
  }

  _generateMockPlan(member, planType, errorMsg = null) {
    const c = member.target_calories;
    const m = member.target_macros;
    const pref = member.regional_preference ? member.regional_preference.toLowerCase() : '';
    const veg = member.dietary_type.toLowerCase() === 'vegetarian' || member.dietary_type.toLowerCase() === 'vegan';

    let b_title, b_ing, l_title, l_ing, s_title, s_ing, d_title, d_ing;

    if (veg) {
      b_title = pref.includes('south') ? 'Ragi Vegetable Upma' : 'Stuffed Paneer Phulka with Curd';
      b_ing = '50g semolina/ragi flour, mixed vegetables, mustard seeds, curry leaves, 1 tsp oil.';
      l_title = pref.includes('south') ? 'Brown Rice, Sambar, & Cabbage Poriyal' : 'Dal Tadka, Mixed Veg Sabzi, & Whole Wheat Rotis';
      l_ing = '1 cup cooked brown rice/2 rotis, 1 katori dal/sambar, 1 katori vegetable side, cucumber salad.';
      s_title = 'Roasted Makhana & Spiced Buttermilk';
      s_ing = '1 cup makhana dry-roasted with pinch of turmeric, 1 glass low-fat buttermilk.';
      d_title = pref.includes('south') ? 'Paneer & Broccoli Stir Fry with Quinoa' : 'Paneer Bhurji & Multigrain Phulka';
      d_ing = '100g paneer cubes, mixed peppers, broccoli/cabbage, stir-fried with 1 tsp mustard oil, served with 1 cup cooked quinoa/2 thin chapatis.';
    } else {
      b_title = 'Egg White Omelette with Oats Toast';
      b_ing = '3 egg whites, onions, tomatoes, green chillies, 2 slices whole-wheat/oats bread toasted.';
      l_title = pref.includes('south') ? 'Grilled Fish Curry with Red Rice' : 'Chicken Tikka Salad & Whole Wheat Phulka';
      l_ing = '150g grilled chicken breast/fish, mixed green salad, olive oil dressing, 1-2 thin chapatis.';
      s_title = 'Boiled Egg (1) & Green Tea';
      s_ing = '1 hard-boiled egg with black pepper, 1 cup unsweetened green tea.';
      d_title = 'Stir-fried Chicken with Bell Peppers & Brown Rice';
      d_ing = '120g lean chicken breast stir-fried with olive oil, capsicum, onions, garlic, served with 1/2 cup brown rice.';
    }

    if (planType.toLowerCase() === 'daily') {
      return {
        calories: c,
        macros: m,
        meals: {
          breakfast: { title: b_title, ingredients: b_ing, calories: Math.round(c * 0.22), protein: Math.round(m.protein * 0.22), carbs: Math.round(m.carbs * 0.22), fat: Math.round(m.fat * 0.22) },
          lunch: { title: l_title, ingredients: l_ing, calories: Math.round(c * 0.35), protein: Math.round(m.protein * 0.35), carbs: Math.round(m.carbs * 0.35), fat: Math.round(m.fat * 0.35) },
          snacks: { title: s_title, ingredients: s_ing, calories: Math.round(c * 0.13), protein: Math.round(m.protein * 0.13), carbs: Math.round(m.carbs * 0.13), fat: Math.round(m.fat * 0.13) },
          dinner: { title: d_title, ingredients: d_ing, calories: Math.round(c * 0.30), protein: Math.round(m.protein * 0.30), carbs: Math.round(m.carbs * 0.30), fat: Math.round(m.fat * 0.30) }
        },
        recommendations: [
          'Drink at least 3-4 liters of water throughout the day.',
          'Include a 20-minute brisk walk after your largest meal.',
          `Notice: This is a fallback plan (Reason: ${errorMsg ? errorMsg : 'API key not configured'}). Setup GOOGLE_API_KEY in .env for custom AI meal plans.`
        ]
      };
    } else {
      const days = {};
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      weekdays.forEach(day => {
        days[day] = {
          calories: c,
          macros: m,
          meals: {
            breakfast: { title: `${b_title} (${day.substring(0, 3)})`, ingredients: b_ing, calories: Math.round(c * 0.22) },
            lunch: { title: `${l_title} (${day.substring(0, 3)})`, ingredients: l_ing, calories: Math.round(c * 0.35) },
            snacks: { title: `${s_title} (${day.substring(0, 3)})`, ingredients: s_ing, calories: Math.round(c * 0.13) },
            dinner: { title: `${d_title} (${day.substring(0, 3)})`, ingredients: d_ing, calories: Math.round(c * 0.30) }
          }
        };
      });
      return {
        days,
        recommendations: [
          'Vary your vegetable intake to cover multiple micronutrients.',
          'Pre-prep your meals on Sunday to stay on track during busy days.',
          `Notice: This is a fallback plan (Reason: ${errorMsg ? errorMsg : 'API key not configured'}). Setup GOOGLE_API_KEY in .env for custom AI meal plans.`
        ]
      };
    }
  }
}

export default GeminiService;
