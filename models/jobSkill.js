// models/JobSkill.js
const mongoose = require('mongoose');

const jobSkillSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => require('uuid').v4(),
    },
    job_post_id: {
      type: String,
      ref: 'JobPost',
      required: true,
    },
    skill_id: {
      type: String,
      ref: 'Skill',
      required: true,
    },
    is_required: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  }
);

// Compound index to prevent duplicates
jobSkillSchema.index({ job_post_id: 1, skill_id: 1 }, { unique: true });

module.exports = mongoose.model('JobSkill', jobSkillSchema);
