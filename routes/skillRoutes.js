const express = require('express');
const router = express.Router();
const Skill = require('../models/skill');

// POST /api/skills - Create skill
router.post('/', async (req, res) => {
  try {
    const skill = new Skill(req.body);
    const savedSkill = await skill.save();

    res.status(201).json({
      success: true,
      data: savedSkill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/skills/bulk - Create multiple skills
router.post('/bulk', async (req, res) => {
  try {
    const { skills } = req.body;
    const createdSkills = await Skill.insertMany(skills);

    res.status(201).json({
      success: true,
      data: createdSkills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/skills - Get all skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().lean();
    res.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
