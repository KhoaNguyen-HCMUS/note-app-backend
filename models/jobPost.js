// models/JobPost.js
const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => require('uuid').v4(),
    },
    company_id: {
      type: String,
      ref: 'Company',
      required: true,
    },
    created_by: {
      type: String,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
    },
    responsibilities: {
      type: String,
    },
    benefits: {
      type: String,
    },
    category_id: {
      type: String,
      ref: 'JobCategory',
    },
    job_type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      required: true,
    },
    employment_type: {
      type: String,
      enum: ['permanent', 'temporary', 'contract'],
      default: 'permanent',
    },
    experience_level: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    salary_min: {
      type: Number,
    },
    salary_max: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'VND', 'EUR', 'GBP'],
    },
    is_salary_negotiable: {
      type: Boolean,
      default: false,
    },
    application_deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'closed', 'rejected'],
      default: 'draft',
    },
    cost_coin: {
      type: Number,
      default: 0,
    },
    views_count: {
      type: Number,
      default: 0,
    },
    applications_count: {
      type: Number,
      default: 0,
    },
    saved_count: {
      type: Number,
      default: 0,
    },
    moderator_notes: {
      type: String,
    },
    approved_by: {
      type: String,
      ref: 'User',
    },
    approved_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// Indexes for better performance
jobPostSchema.index({ status: 1, created_at: -1 });
jobPostSchema.index({ company_id: 1 });
jobPostSchema.index({ category_id: 1 });
jobPostSchema.index({ location: 1 });
jobPostSchema.index({ job_type: 1 });
jobPostSchema.index({ experience_level: 1 });

module.exports = mongoose.model('JobPost', jobPostSchema);
