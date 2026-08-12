const express = require('express');
const router = express.Router();
const { FamilyMember, WeightLog, ChatHistory, MealPlan } = require('../models');
const GeminiService = require('../services/geminiService');

const geminiService = new GeminiService();

// ----------------------------------------------------
// FAMILY MEMBERS CRUD API
// ----------------------------------------------------

router.get('/members', async (req, res) => {
  try {
    const members = await FamilyMember.findAll();
    res.json(members.map(m => m.toDict()));
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch members: ${err.message}` });
  }
});

router.get('/members/:member_id', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member.toDict());
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch member: ${err.message}` });
  }
});

router.post('/members', async (req, res) => {
  const data = req.body || {};

  // Validation
  const requiredFields = ['name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'dietary_type', 'health_goals'];
  const missing = requiredFields.filter(field => !(field in data) || data[field] === null || data[field] === undefined);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const member = await FamilyMember.create({
      name: data.name,
      age: parseInt(data.age),
      gender: data.gender,
      height_cm: parseFloat(data.height_cm),
      weight_kg: parseFloat(data.weight_kg),
      activity_level: data.activity_level,
      dietary_type: data.dietary_type,
      allergies: data.allergies || '',
      health_goals: data.health_goals,
      regional_preference: data.regional_preference || 'None'
    });

    // Log initial weight
    await WeightLog.create({
      member_id: member.id,
      weight_kg: member.weight_kg,
      bmi: member.bmi
    });

    res.status(201).json(member.toDict());
  } catch (err) {
    res.status(500).json({ error: `Failed to create member: ${err.message}` });
  }
});

router.put('/members/:member_id', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const data = req.body || {};

    if ('name' in data) member.name = data.name;
    if ('age' in data) member.age = parseInt(data.age);
    if ('gender' in data) member.gender = data.gender;
    if ('height_cm' in data) member.height_cm = parseFloat(data.height_cm);
    if ('activity_level' in data) member.activity_level = data.activity_level;
    if ('dietary_type' in data) member.dietary_type = data.dietary_type;
    if ('allergies' in data) member.allergies = data.allergies;
    if ('health_goals' in data) member.health_goals = data.health_goals;
    if ('regional_preference' in data) member.regional_preference = data.regional_preference;

    // Special weight update logic
    if ('weight_kg' in data) {
      const newWeight = parseFloat(data.weight_kg);
      if (newWeight !== member.weight_kg) {
        member.weight_kg = newWeight;
        // Trigger weight history log
        await WeightLog.create({
          member_id: member.id,
          weight_kg: newWeight,
          bmi: member.bmi
        });
      }
    }

    await member.save();
    res.json(member.toDict());
  } catch (err) {
    res.status(500).json({ error: `Failed to update member: ${err.message}` });
  }
});
router.delete('/members/:member_id', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Manually delete dependent records to satisfy foreign key constraints
    await WeightLog.destroy({ where: { member_id: member.id } });
    await ChatHistory.destroy({ where: { member_id: member.id } });
    await MealPlan.destroy({ where: { member_id: member.id } });

    // Now delete the member
    await member.destroy();
    res.json({ success: true, message: 'Member profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: `Failed to delete member: ${err.message}` });
  }
});
// ----------------------------------------------------
// WEIGHT LOGGING API
// ----------------------------------------------------

router.post('/members/:member_id/weight', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const data = req.body || {};
    if (!('weight_kg' in data)) {
      return res.status(400).json({ error: 'Weight in kg is required' });
    }

    const weightVal = parseFloat(data.weight_kg);
    member.weight_kg = weightVal;
    await member.save();

    const logEntry = await WeightLog.create({
      member_id: member.id,
      weight_kg: weightVal,
      bmi: member.bmi
    });

    res.json({
      success: true,
      member: member.toDict(),
      logged_entry: logEntry.toDict()
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to log weight: ${err.message}` });
  }
});

router.get('/members/:member_id/weight-history', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const logs = await WeightLog.findAll({
      where: { member_id: req.params.member_id },
      order: [['logged_date', 'ASC']]
    });

    res.json(logs.map(log => log.toDict()));
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch weight history: ${err.message}` });
  }
});

// ----------------------------------------------------
// CHAT LOGIC API
// ----------------------------------------------------

router.get('/members/:member_id/chats', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const chats = await ChatHistory.findAll({
      where: { member_id: req.params.member_id },
      order: [['timestamp', 'ASC']]
    });

    res.json(chats.map(chat => chat.toDict()));
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch chat history: ${err.message}` });
  }
});

router.post('/members/:member_id/chat', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const data = req.body || {};
    const userMessage = (data.message || '').trim();

    if (!userMessage) {
      return res.status(400).json({ error: 'Message content is empty' });
    }

    // Save user message to database
    const userChat = await ChatHistory.create({
      member_id: member.id,
      sender: 'user',
      message: userMessage
    });

    // Get past history for context
    const pastChats = await ChatHistory.findAll({
      where: { member_id: member.id },
      order: [['timestamp', 'ASC']],
      limit: 20
    });

    // Remove the latest userChat from past history context passed to Gemini (since SDK handles latest message as input)
    const contextHistory = pastChats.filter(chat => chat.id !== userChat.id);

    // Call Gemini API
    const aiResponse = await geminiService.getChatResponse(member, contextHistory, userMessage);

    // Save AI response to database
    const agentChat = await ChatHistory.create({
      member_id: member.id,
      sender: 'agent',
      message: aiResponse
    });

    res.json({
      user_message: userChat.toDict(),
      agent_message: agentChat.toDict()
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to process chat: ${err.message}` });
  }
});

// ----------------------------------------------------
// MEAL PLANNER API
// ----------------------------------------------------

router.post('/members/:member_id/meal-plan/generate', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const data = req.body || {};
    const planType = data.plan_type || 'Daily';

    // Request from Gemini
    const mealPlanData = await geminiService.generateMealPlan(member, planType);

    // Save to database
    const newPlan = await MealPlan.create({
      member_id: member.id,
      plan_type: planType,
      plan_json: JSON.stringify(mealPlanData)
    });

    res.json(newPlan.toDict());
  } catch (err) {
    res.status(500).json({ error: `Failed to generate meal plan: ${err.message}` });
  }
});

router.get('/members/:member_id/meal-plans', async (req, res) => {
  try {
    const member = await FamilyMember.findByPk(req.params.member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const plans = await MealPlan.findAll({
      where: { member_id: req.params.member_id },
      order: [['created_at', 'DESC']]
    });

    res.json(plans.map(p => p.toDict()));
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch meal plans: ${err.message}` });
  }
});

module.exports = router;
