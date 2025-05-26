const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
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
router.get('/', auth, getTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, getTaskById);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, createTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, deleteTask);

// @route   PUT /api/tasks/:id/status
// @desc    Update task status
// @access  Private
router.put('/:id/status', auth, updateTaskStatus);

// @route   POST /api/tasks/:id/collaborators
// @desc    Add collaborator to task
// @access  Private
router.post('/:id/collaborators', auth, addCollaborator);

// @route   DELETE /api/tasks/:id/collaborators/:userId
// @desc    Remove collaborator from task
// @access  Private
router.delete('/:id/collaborators/:userId', auth, removeCollaborator);

module.exports = router;
