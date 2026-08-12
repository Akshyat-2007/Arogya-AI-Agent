const express = require('express');
const router = express.Router();
const { FamilyMember, MealPlan } = require('../models');

router.get('/', async (req, res) => {
  try {
    const firstMember = await FamilyMember.findOne();
    if (firstMember) {
      return res.redirect(`/dashboard?member_id=${firstMember.id}`);
    }
    return res.redirect('/profiles');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const memberId = req.query.member_id ? parseInt(req.query.member_id) : null;
    const members = await FamilyMember.findAll();

    let selectedMember = null;
    if (memberId) {
      selectedMember = await FamilyMember.findByPk(memberId);
    } else if (members.length > 0) {
      selectedMember = members[0];
    }

    res.render('dashboard', {
      title: 'Nutrition Dashboard - Arogya AI',
      members,
      selected_member: selectedMember,
      path: '/dashboard'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/profiles', async (req, res) => {
  try {
    const members = await FamilyMember.findAll();
    res.render('profiles', {
      title: 'Family Profiles - Arogya AI',
      members,
      path: '/profiles'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/chat', async (req, res) => {
  try {
    const memberId = req.query.member_id ? parseInt(req.query.member_id) : null;
    const members = await FamilyMember.findAll();

    let selectedMember = null;
    if (memberId) {
      selectedMember = await FamilyMember.findByPk(memberId);
    } else if (members.length > 0) {
      selectedMember = members[0];
    }

    res.render('chat', {
      title: 'Chat with Arogya AI - Personal Nutrition Assistant',
      members,
      selected_member: selectedMember,
      path: '/chat'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/meal-planner', async (req, res) => {
  try {
    const memberId = req.query.member_id ? parseInt(req.query.member_id) : null;
    const members = await FamilyMember.findAll();

    let selectedMember = null;
    if (memberId) {
      selectedMember = await FamilyMember.findByPk(memberId);
    } else if (members.length > 0) {
      selectedMember = members[0];
    }

    let latestPlan = null;
    if (selectedMember) {
      latestPlan = await MealPlan.findOne({
        where: { member_id: selectedMember.id },
        order: [['created_at', 'DESC']]
      });
    }

    res.render('meal_planner', {
      title: 'Meal Planner - Arogya AI',
      members,
      selected_member: selectedMember,
      latest_plan: latestPlan,
      path: '/meal-planner'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/bmi', (req, res) => {
  res.render('bmi', {
    title: 'BMI Calculator - Arogya AI',
    path: '/bmi'
  });
});

module.exports = router;
