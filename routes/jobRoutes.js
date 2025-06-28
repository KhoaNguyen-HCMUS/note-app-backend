// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const JobPost = require('../models/jobPost');
const Company = require('../models/company');
const JobCategory = require('../models/jobCategory');
const JobSkill = require('../models/jobSkill');
const Skill = require('../models/skill');

// GET /api/jobs - Get job list with filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      job_type,
      experience_level,
      category_id,
      company_id,
      salary_min,
      salary_max,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    // Search in title and description
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Job type filter
    if (job_type) {
      filter.job_type = job_type;
    }

    // Experience level filter
    if (experience_level) {
      filter.experience_level = experience_level;
    }

    // Category filter
    if (category_id) {
      filter.category_id = category_id;
    }

    // Company filter
    if (company_id) {
      filter.company_id = company_id;
    }

    // Salary range filter
    if (salary_min || salary_max) {
      filter.salary_min = {};
      if (salary_min) filter.salary_min.$gte = parseInt(salary_min);
      if (salary_max) filter.salary_max = { $lte: parseInt(salary_max) };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Execute query with population
    const jobs = await JobPost.find(filter)
      .populate('company_id', 'name logo_url industry size headquarters')
      .populate('category_id', 'name')
      .populate('created_by', 'email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await JobPost.countDocuments(filter);

    // Add skills to each job
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const jobSkills = await JobSkill.find({ job_post_id: job._id }).populate('skill_id', 'name category').lean();

        return {
          ...job,
          skills: jobSkills.map((js) => ({
            ...js.skill_id,
            is_required: js.is_required,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: {
        jobs: jobsWithSkills,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_items: total,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// GET /api/jobs/:id - Get job detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find job and populate related data
    const job = await JobPost.findById(id)
      .populate('company_id', 'name description industry size website logo_url headquarters founded_year')
      .populate('category_id', 'name description')
      .populate('created_by', 'email')
      .populate('approved_by', 'email')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if job is active
    if (job.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Job is not available',
      });
    }

    // Get job skills
    const jobSkills = await JobSkill.find({ job_post_id: id }).populate('skill_id', 'name category').lean();

    // Increment view count
    await JobPost.findByIdAndUpdate(id, { $inc: { views_count: 1 } });

    // Get related jobs from same company
    const relatedJobs = await JobPost.find({
      company_id: job.company_id._id,
      _id: { $ne: id },
      status: 'active',
    })
      .populate('company_id', 'name logo_url')
      .limit(5)
      .lean();

    const jobDetail = {
      ...job,
      skills: jobSkills.map((js) => ({
        ...js.skill_id,
        is_required: js.is_required,
      })),
      related_jobs: relatedJobs,
    };

    res.json({
      success: true,
      data: jobDetail,
    });
  } catch (error) {
    console.error('Get job detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// GET /api/jobs/company/:companyId - Get jobs by company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await JobPost.find({
      company_id: companyId,
      status: 'active',
    })
      .populate('category_id', 'name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await JobPost.countDocuments({
      company_id: companyId,
      status: 'active',
    });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_items: total,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      company_id,
      created_by,
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      category_id,
      job_type,
      employment_type,
      experience_level,
      location,
      salary_min,
      salary_max,
      currency,
      is_salary_negotiable,
      application_deadline,
      skills, // Array of {skill_id, is_required}
    } = req.body;

    // Validate required fields
    if (!company_id || !created_by || !title || !description || !job_type || !experience_level || !location) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: company_id, created_by, title, description, job_type, experience_level, location',
      });
    }

    // Verify company exists
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    // Verify category exists (if provided)
    if (category_id) {
      const category = await JobCategory.findById(category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }
    }

    // Create job post
    const jobPost = new JobPost({
      company_id,
      created_by,
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      category_id,
      job_type,
      employment_type: employment_type || 'permanent',
      experience_level,
      location,
      salary_min,
      salary_max,
      currency: currency || 'USD',
      is_salary_negotiable: is_salary_negotiable || false,
      application_deadline: application_deadline ? new Date(application_deadline) : null,
      status: 'active', // Auto approve for now
      cost_coin: 10, // Default cost
    });

    const savedJob = await jobPost.save();

    // Add skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const jobSkills = [];

      for (const skillData of skills) {
        // Verify skill exists
        const skill = await Skill.findById(skillData.skill_id);
        if (skill) {
          jobSkills.push({
            job_post_id: savedJob._id,
            skill_id: skillData.skill_id,
            is_required: skillData.is_required || false,
          });
        }
      }

      if (jobSkills.length > 0) {
        await JobSkill.insertMany(jobSkills);
      }
    }

    // Return created job with populated data
    const newJob = await JobPost.findById(savedJob._id)
      .populate('company_id', 'name logo_url industry')
      .populate('category_id', 'name')
      .lean();

    // Get skills
    const jobSkills = await JobSkill.find({ job_post_id: savedJob._id }).populate('skill_id', 'name category').lean();

    res.status(201).json({
      success: true,
      message: 'Job post created successfully',
      data: {
        ...newJob,
        skills: jobSkills.map((js) => ({
          ...js.skill_id,
          is_required: js.is_required,
        })),
      },
    });
  } catch (error) {
    console.error('Create job post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// POST /api/jobs/bulk - Create multiple jobs (for testing)
router.post('/bulk', async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({
        success: false,
        message: 'Jobs array is required',
      });
    }

    const createdJobs = [];

    for (const jobData of jobs) {
      try {
        const jobPost = new JobPost(jobData);
        const savedJob = await jobPost.save();
        createdJobs.push(savedJob);
      } catch (error) {
        console.error('Error creating job:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdJobs.length} job posts`,
      data: createdJobs,
    });
  } catch (error) {
    console.error('Bulk create jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;
