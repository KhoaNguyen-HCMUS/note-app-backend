// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const JobCategory = require('../models/jobCategory');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await JobCategory.find().populate('parent_id', 'name').sort({ name: 1 }).lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await JobCategory.findById(id).populate('parent_id', 'name').lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Get subcategories
    const subcategories = await JobCategory.find({ parent_id: id }).sort({ name: 1 }).lean();

    res.json({
      success: true,
      data: {
        ...category,
        subcategories,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// POST /api/categories - Create new category
router.post('/', async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    // Check if parent exists (if provided)
    if (parent_id) {
      const parentCategory = await JobCategory.findById(parent_id);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found',
        });
      }
    }

    const category = new JobCategory({
      name: name.trim(),
      description: description?.trim(),
      parent_id: parent_id || null,
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory,
    });
  } catch (error) {
    console.error('Create category error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// POST /api/categories/bulk - Create multiple categories
router.post('/bulk', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required',
      });
    }

    const createdCategories = [];
    const errors = [];

    for (let i = 0; i < categories.length; i++) {
      try {
        const categoryData = categories[i];

        if (!categoryData.name) {
          errors.push(`Category ${i + 1}: Name is required`);
          continue;
        }

        const category = new JobCategory({
          name: categoryData.name.trim(),
          description: categoryData.description?.trim(),
          parent_id: categoryData.parent_id || null,
        });

        const savedCategory = await category.save();
        createdCategories.push(savedCategory);
      } catch (error) {
        if (error.code === 11000) {
          errors.push(`Category ${i + 1}: Name already exists`);
        } else {
          errors.push(`Category ${i + 1}: ${error.message}`);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdCategories.length} categories`,
      data: createdCategories,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk create categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    const category = await JobCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if parent exists (if provided)
    if (parent_id && parent_id !== category.parent_id) {
      const parentCategory = await JobCategory.findById(parent_id);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found',
        });
      }

      // Prevent circular reference
      if (parent_id === id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent',
        });
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description?.trim();
    if (parent_id !== undefined) category.parent_id = parent_id || null;

    const updatedCategory = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await JobCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category has subcategories
    const subcategories = await JobCategory.find({ parent_id: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.',
      });
    }

    // Check if category is used by jobs
    const JobPost = require('../models/jobPost');
    const jobsCount = await JobPost.countDocuments({ category_id: id });
    if (jobsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${jobsCount} job post(s).`,
      });
    }

    await JobCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// GET /api/categories/tree - Get categories as tree structure
router.get('/tree/structure', async (req, res) => {
  try {
    const categories = await JobCategory.find().sort({ name: 1 }).lean();

    // Build tree structure
    const categoryMap = {};
    const rootCategories = [];

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat, children: [] };
    });

    // Second pass: build tree
    categories.forEach((cat) => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat._id]);
      } else {
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    res.json({
      success: true,
      data: rootCategories,
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;
