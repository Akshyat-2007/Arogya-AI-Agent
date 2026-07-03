# Arogya AI - Personal Family Nutrition Agent

Arogya AI is a premium, responsive, AI-powered Nutrition Coach and Health Dashboard web application built with **Python Flask** and **Google Gemini (Generative AI SDK)**. It offers family profile support, a Body Mass Index (BMI) calculator, dynamic weight charts, real-time chat with custom context, and structured meal planning (daily/weekly) optimized for Indian regional food preferences and diets.

---

## 🌟 Key Features

1. **Family Profile Management (CRUD):** 
   - Add, edit, and delete profiles for multiple family members.
   - Individual tracking of age, gender, height, weight, activity levels, and custom dietary preferences.
2. **Interactive Calorie & Macro Dashboard:**
   - Computes daily target calories and macronutrient ratios (Protein, Carbs, Fats) programmatically using the **Harris-Benedict equation** and custom health goals.
   - Interactive weight history visualization powered by **Chart.js** with theme-adaptive styling.
3. **AI Nutrition Coach Chat:**
   - Conversation sessions with the chatbot, pre-seeded with the selected family member's complete medical profile, weight history, and dietary preferences.
   - Robust inline Markdown parsing, enabling the AI to return tables, lists, and formatted text directly into the chat bubbles.
4. **Structured Daily & Weekly Meal Planners:**
   - Generates calorie-accurate Indian meal schedules (Breakfast, Lunch, Snacks, Dinner) complete with recipes and exact portion sizes.
   - Direct integration with Gemini JSON mode (`response_mime_type="application/json"`).
   - Fallback generator providing structured local recommendations if the API is offline or key is missing.
5. **BMI Visualizer:**
   - Interactive standalone calculator with dial meters.
   - Allows users to instantly seed and create new profiles directly from calculated results.
6. **Premium Responsive Theme:**
   - Frosted-glass components, deep gradients, dark mode default, micro-animations, and full mobile optimization.
   - Persisted theme settings stored in the browser's local storage.

---

## 📁 Project Structure

```
nutrition ai/
│
├── config.py                  # Configurations (System Instructions, API Keys, Database)
├── app.py                     # Primary Flask entrypoint
├── database.py                # Database configuration (SQLAlchemy)
├── requirements.txt           # Package dependencies
├── .env                       # Local environment variables (Git ignored)
├── .env.example               # Environment variables template
├── README.md                  # Instructions and setup guide
│
├── models/                    # SQLAlchemy Database Models
│   ├── __init__.py            # Model packaging
│   ├── member.py              # FamilyMember schema & target calculator
│   ├── weight_log.py          # Weight entries timeline model
│   ├── meal_plan.py           # Saved meal plans model
│   └── chat.py                # Chat history model
│
├── services/                  # Business Logic
│   ├── __init__.py
│   └── gemini_service.py      # Gemini Chat & JSON Meal Plan Generator
│
├── routes/                    # Route Controllers (Blueprints)
│   ├── __init__.py
│   ├── web.py                 # HTML view routers
│   └── api.py                 # JSON AJAX REST endpoints
│
├── static/                    # Frontend assets
│   ├── css/
│   │   └── styles.css         # Theme stylesheet (Gradients, Glassmorphism, Print-media)
│   └── js/
│       ├── theme.js           # Light/Dark mode toggler & persistence
│       ├── chat.js            # Chat streams & inline markdown parser
│       ├── dashboard.js       # Chart.js line charts & weight logging
│       └── meal.js            # Planner handlers & print controller
│
└── templates/                 # Jinja2 views
    ├── base.html              # Core skeleton and navbar layout
    ├── dashboard.html         # Charts, logs, and macro tracking dashboard
    ├── chat.html              # Coach chat interface
    ├── meal_planner.html      # Diet planner grid (Daily/Weekly view)
    ├── profiles.html          # Profile manager grid & registration forms
    └── bmi.html               # Visual calculator with profile shortcuts
```

---

## 🚀 Setup and Installation

### 1. Install Python
Ensure Python 3.9+ is installed. If `python` is not in your environment PATH, you can use the Windows Python launcher (`py`).

### 2. Prepare Environment Variables
Rename the template file `.env.example` to `.env` in the root of the project:
```bash
copy .env.example .env
```
Open `.env` and configure your settings:
- `SECRET_KEY`: A random secure string for Flask session signing.
- `GOOGLE_API_KEY`: Paste your Gemini API key here.
  > 💡 Get a free API key from **[Google AI Studio](https://aistudio.google.com/)**.

### 3. Install Dependencies
Install all required libraries specified in `requirements.txt`:
```bash
pip install -r requirements.txt
# OR if using the Windows Python launcher
py -m pip install -r requirements.txt
```

### 4. Launch the Server
Run the Flask server locally:
```bash
python app.py
# OR
py app.py
```
Open your browser and navigate to **`http://localhost:5000`** to view the application.

---

## 🛠 Customizing Agent Behavior (`AGENT_INSTRUCTIONS`)

You can easily adapt the AI Nutrition Coach's tone, rules, and food references. Open `config.py` and modify the `Config.AGENT_INSTRUCTIONS` multiline string.

### Customization Options:
- **Tone/Persona:** Customize the name ("Arogya AI") or change the tone (e.g., make it more technical, humorous, or strict).
- **Indian Diet Customizations:** Tailor the default regional staples. For example, if you want to focus exclusively on North Indian vegetarian foods, add:
  > *"Prioritize paneer, rajma, chole, and seasonal wheat-based meals. Avoid recommending eggs or fish."*
- **Safety Disclaimers:** Change warning thresholds. If you want the agent to automatically refuse diets for kidney conditions, add a clause:
  > *"If the user mentions kidney issues, immediately stop recommending high-protein foods and print: 'Warning: For kidney health, consult a nephrologist.'"*

---

## 🌐 Production Deployment

### Option A: Render (Easiest)
1. Push your codebase to a GitHub repository.
2. Log in to [Render](https://render.com/) and click **New > Web Service**.
3. Link your GitHub repository.
4. Set the following configuration values:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app` (Make sure to add `gunicorn` to `requirements.txt` or install it).
5. Under **Environment Variables**, add:
   - `GOOGLE_API_KEY` = `your_gemini_key`
   - `SECRET_KEY` = `a_random_hash`
   - `DATABASE_URL` = `sqlite:////opt/render/project/src/nutrition_agent.db`
6. Add a **Disk (Mount)** if you are using SQLite in production, to prevent data from wiping on server updates. Mount path: `/opt/render/project/src/`. Alternatively, configure a PostgreSQL database on Render and set `DATABASE_URL=postgresql://...`.

### Option B: Google Cloud Run (Containerized)
1. Add a simple `Dockerfile` in the root:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt gunicorn
   COPY . .
   EXPOSE 8080
   CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
   ```
2. Build and publish your container image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/nutrition-agent
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy nutrition-agent --image gcr.io/YOUR-PROJECT-ID/nutrition-agent --platform managed --allow-unauthenticated
   ```
4. Set your environment variables in the Cloud Run console under **Variables & Secrets** (specifically, mount your `GOOGLE_API_KEY`).
