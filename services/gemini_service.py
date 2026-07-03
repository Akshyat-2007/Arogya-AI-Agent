import json
import logging
import google.generativeai as genai
from config import Config

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key_configured = False
        self.configure_api()

    def configure_api(self):
        """Configure the google-generativeai client using the key from config."""
        api_key = Config.GEMINI_API_KEY
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                genai.configure(api_key=api_key)
                self.api_key_configured = True
                logger.info("Gemini API successfully configured.")
            except Exception as e:
                logger.error(f"Error configuring Gemini API: {str(e)}")
                self.api_key_configured = False
        else:
            logger.warning("Gemini API Key is not set or is still the default placeholder.")
            self.api_key_configured = False

    def _get_model(self, system_instruction=None, json_mode=False):
        """Helper to get a GenerativeModel instance with proper system instructions and parameters."""
        if not self.api_key_configured:
            # Re-attempt configuration in case env was updated
            self.configure_api()
            
        generation_config = {}
        if json_mode:
            generation_config["response_mime_type"] = "application/json"

        # If system instruction is provided, we merge it with the default AGENT_INSTRUCTIONS
        instructions = Config.AGENT_INSTRUCTIONS
        if system_instruction:
            instructions += f"\n\nAdditional Instructions:\n{system_instruction}"

        return genai.GenerativeModel(
            model_name=Config.GEMINI_MODEL,
            generation_config=generation_config,
            system_instruction=instructions
        )

    def get_chat_response(self, member, chat_history, user_message):
        """
        Sends a message to the Gemini chat session.
        - member: FamilyMember database object for context
        - chat_history: List of past ChatHistory objects
        - user_message: String message sent by the user
        """
        if not self.api_key_configured:
            return "⚠️ Gemini API key is missing or invalid. Please configure your `.env` file with a valid `GOOGLE_API_KEY`."

        try:
            # Create member profile context block
            member_context = (
                f"Active Family Member Profile:\n"
                f"- Name: {member.name}\n"
                f"- Age: {member.age} years old\n"
                f"- Gender: {member.gender}\n"
                f"- Height: {member.height_cm} cm\n"
                f"- Weight: {member.weight_kg} kg\n"
                f"- BMI: {member.bmi} ({member.bmi_category['label']})\n"
                f"- Activity Level: {member.activity_level.capitalize()}\n"
                f"- Dietary Type: {member.dietary_type}\n"
                f"- Allergies/Intolerances: {member.allergies if member.allergies else 'None'}\n"
                f"- Health Goals: {member.health_goals}\n"
                f"- Regional Preference: {member.regional_preference}\n"
                f"- Estimated Calorie Budget: {member.target_calories} kcal/day\n"
                f"- Target Macros: Protein: {member.target_macros['protein']}g, Carbs: {member.target_macros['carbs']}g, Fat: {member.target_macros['fat']}g\n"
                f"Please tailor your responses to support this specific family member."
            )

            # Build Gemini history format
            formatted_history = []
            
            # Seed the model with member context as a system setup in the first prompt
            # But the SDK allows chat history. We will put the member context at the top of the history.
            formatted_history.append({
                "role": "user",
                "parts": [f"Hello. Here is my profile info. Please remember it for this session.\n\n{member_context}"]
            })
            formatted_history.append({
                "role": "model",
                "parts": [f"Hello! I am Arogya AI, your personal nutrition coach. I have loaded the profile for {member.name}. I am ready to guide you based on their nutritional targets: {member.target_calories} calories, and preferred {member.dietary_type} ({member.regional_preference}) diet. How can I help today?"]
            })

            # Append the actual chat history
            for chat in chat_history:
                role = "user" if chat.sender == "user" else "model"
                formatted_history.append({
                    "role": role,
                    "parts": [chat.message]
                })

            # Create model and start chat
            model = self._get_model()
            chat_session = model.start_chat(history=formatted_history)
            
            response = chat_session.send_message(user_message)
            return response.text

        except Exception as e:
            logger.error(f"Error in Gemini Chat Response: {str(e)}")
            return f"⚠️ An error occurred while generating a response: {str(e)}"

    def generate_meal_plan(self, member, plan_type="Daily"):
        """
        Generates a structured daily or weekly meal plan in JSON format.
        - member: FamilyMember database object
        - plan_type: "Daily" or "Weekly"
        """
        if not self.api_key_configured:
            return self._generate_mock_plan(member, plan_type, error_msg="Gemini API key is not configured.")

        # Construct meal planning instruction prompt
        diet_desc = f"{member.dietary_type} diet"
        if member.regional_preference and member.regional_preference != 'None':
            diet_desc += f" with {member.regional_preference} regional preference"

        prompt = (
            f"Generate a customized {plan_type.lower()} meal plan for {member.name}.\n"
            f"Profile details:\n"
            f"- Age: {member.age}, Gender: {member.gender}\n"
            f"- Height: {member.height_cm}cm, Weight: {member.weight_kg}kg\n"
            f"- Daily Calorie Goal: {member.target_calories} kcal\n"
            f"- Target Macros: Protein: {member.target_macros['protein']}g, Carbs: {member.target_macros['carbs']}g, Fat: {member.target_macros['fat']}g\n"
            f"- Diet: {diet_desc}\n"
            f"- Allergies/Intolerances: {member.allergies if member.allergies else 'None'}\n"
            f"- Health Goal: {member.health_goals}\n\n"
        )

        if plan_type.lower() == "daily":
            prompt += (
                "Respond ONLY with a JSON object following this EXACT schema (do not include extra text/formatting outside the JSON):\n"
                "{\n"
                '  "calories": 1800,\n'
                '  "macros": {"protein": 75, "carbs": 240, "fat": 50},\n'
                '  "meals": {\n'
                '    "breakfast": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 400, "protein": 15, "carbs": 55, "fat": 10},\n'
                '    "lunch": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 600, "protein": 25, "carbs": 80, "fat": 15},\n'
                '    "snacks": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 200, "protein": 8, "carbs": 25, "fat": 6},\n'
                '    "dinner": {"title": "Meal title", "ingredients": "List ingredients & instructions", "calories": 600, "protein": 27, "carbs": 80, "fat": 14}\n'
                '  },\n'
                '  "recommendations": ["Recommendation 1", "Recommendation 2"]\n'
                "}\n"
                "Ensure calories, macros, and meals correspond closely to the member's targets. Include authentic Indian ingredients and common household portion sizes."
            )
        else:
            # Weekly plan
            prompt += (
                "Respond ONLY with a JSON object following this EXACT schema (do not include extra text/formatting outside the JSON):\n"
                "{\n"
                '  "days": {\n'
                '    "Monday": {\n'
                '      "calories": 1800,\n'
                '      "macros": {"protein": 75, "carbs": 240, "fat": 50},\n'
                '      "meals": {\n'
                '        "breakfast": {"title": "Meal title", "ingredients": "Ingredients", "calories": 400},\n'
                '        "lunch": {"title": "Meal title", "ingredients": "Ingredients", "calories": 600},\n'
                '        "snacks": {"title": "Meal title", "ingredients": "Ingredients", "calories": 200},\n'
                '        "dinner": {"title": "Meal title", "ingredients": "Ingredients", "calories": 600}\n'
                '      }\n'
                '    },\n'
                '    "Tuesday": { ... (repeat for all days of the week: Monday through Sunday) ... }\n'
                '  },\n'
                '  "recommendations": ["Recommendation 1", "Recommendation 2"]\n'
                "}\n"
                "Make sure all 7 days of the week are covered with varied, nutritionally dense Indian meals that align with the user's requirements."
            )

        try:
            model = self._get_model(
                system_instruction="You are a strict JSON generator. You output only valid JSON matching the exact schema requested.",
                json_mode=True
            )
            response = model.generate_content(prompt)
            plan_data = json.loads(response.text)
            return plan_data
        except Exception as e:
            logger.error(f"Error generating meal plan from Gemini: {str(e)}")
            return self._generate_mock_plan(member, plan_type, error_msg=str(e))

    def _generate_mock_plan(self, member, plan_type, error_msg=None):
        """Generates a high-quality fallback plan if the API fails or is not configured."""
        c = member.target_calories
        m = member.target_macros
        
        pref = member.regional_preference.lower() if member.regional_preference else ""
        veg = member.dietary_type.lower() == "vegetarian" or member.dietary_type.lower() == "vegan"
        
        # Build logical defaults based on preferences
        if veg:
            b_title = "Ragi Vegetable Upma" if "south" in pref else "Stuffed Paneer Phulka with Curd"
            b_ing = "50g semolina/ragi flour, mixed vegetables, mustard seeds, curry leaves, 1 tsp oil."
            l_title = "Brown Rice, Sambar, & Cabbage Poriyal" if "south" in pref else "Dal Tadka, Mixed Veg Sabzi, & Whole Wheat Rotis"
            l_ing = "1 cup cooked brown rice/2 rotis, 1 katori dal/sambar, 1 katori vegetable side, cucumber salad."
            s_title = "Roasted Makhana & Spiced Buttermilk"
            s_ing = "1 cup makhana dry-roasted with pinch of turmeric, 1 glass low-fat buttermilk."
            d_title = "Paneer & Broccoli Stir Fry with Quinoa" if "south" in pref else "Paneer Bhurji & Multigrain Phulka"
            d_ing = "100g paneer cubes, mixed peppers, broccoli/cabbage, stir-fried with 1 tsp mustard oil, served with 1 cup cooked quinoa/2 thin chapatis."
        else:
            b_title = "Egg White Omelette with Oats Toast"
            b_ing = "3 egg whites, onions, tomatoes, green chillies, 2 slices whole-wheat/oats bread toasted."
            l_title = "Grilled Fish Curry with Red Rice" if "south" in pref else "Chicken Tikka Salad & Whole Wheat Phulka"
            l_ing = "150g grilled chicken breast/fish, mixed green salad, olive oil dressing, 1-2 thin chapatis."
            s_title = "Boiled Egg (1) & Green Tea"
            s_ing = "1 hard-boiled egg with black pepper, 1 cup unsweetened green tea."
            d_title = "Stir-fried Chicken with Bell Peppers & Brown Rice"
            d_ing = "120g lean chicken breast stir-fried with olive oil, capsicum, onions, garlic, served with 1/2 cup brown rice."

        if plan_type.lower() == "daily":
            return {
                "calories": c,
                "macros": m,
                "meals": {
                    "breakfast": {"title": b_title, "ingredients": b_ing, "calories": int(c * 0.22), "protein": int(m['protein'] * 0.22), "carbs": int(m['carbs'] * 0.22), "fat": int(m['fat'] * 0.22)},
                    "lunch": {"title": l_title, "ingredients": l_ing, "calories": int(c * 0.35), "protein": int(m['protein'] * 0.35), "carbs": int(m['carbs'] * 0.35), "fat": int(m['fat'] * 0.35)},
                    "snacks": {"title": s_title, "ingredients": s_ing, "calories": int(c * 0.13), "protein": int(m['protein'] * 0.13), "carbs": int(m['carbs'] * 0.13), "fat": int(m['fat'] * 0.13)},
                    "dinner": {"title": d_title, "ingredients": d_ing, "calories": int(c * 0.30), "protein": int(m['protein'] * 0.30), "carbs": int(m['carbs'] * 0.30), "fat": int(m['fat'] * 0.30)}
                },
                "recommendations": [
                    "Drink at least 3-4 liters of water throughout the day.",
                    "Include a 20-minute brisk walk after your largest meal.",
                    f"Notice: This is a fallback plan (Reason: {error_msg if error_msg else 'API key not configured'}). Setup GOOGLE_API_KEY in .env for custom AI meal plans."
                ]
            }
        else:
            # Mock weekly plan
            days = {}
            weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            for day in weekdays:
                days[day] = {
                    "calories": c,
                    "macros": m,
                    "meals": {
                        "breakfast": {"title": f"{b_title} ({day[:3]})", "ingredients": b_ing, "calories": int(c * 0.22)},
                        "lunch": {"title": f"{l_title} ({day[:3]})", "ingredients": l_ing, "calories": int(c * 0.35)},
                        "snacks": {"title": f"{s_title} ({day[:3]})", "ingredients": s_ing, "calories": int(c * 0.13)},
                        "dinner": {"title": f"{d_title} ({day[:3]})", "ingredients": d_ing, "calories": int(c * 0.30)}
                    }
                }
            return {
                "days": days,
                "recommendations": [
                    "Vary your vegetable intake to cover multiple micronutrients.",
                    "Pre-prep your meals on Sunday to stay on track during busy days.",
                    f"Notice: This is a fallback plan (Reason: {error_msg if error_msg else 'API key not configured'}). Setup GOOGLE_API_KEY in .env for custom AI meal plans."
                ]
            }
