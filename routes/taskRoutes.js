const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addCollaborator,
  removeCollaborator,
} = require('../controllers/taskController');

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
router.get('/', protect, getTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', protect, getTaskById);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', protect, createTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', protect, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', protect, deleteTask);

// @route   PUT /api/tasks/:id/status
// @desc    Update task status
// @access  Private
router.put('/:id/status', protect, updateTaskStatus);

// @route   POST /api/tasks/:id/collaborators
// @desc    Add collaborator to task
// @access  Private
router.post('/:id/collaborators', protect, addCollaborator);

// @route   DELETE /api/tasks/:id/collaborators/:userId
// @desc    Remove collaborator from task
// @access  Private
router.delete('/:id/collaborators/:userId', protect, removeCollaborator);

module.exports = router;
