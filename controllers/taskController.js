const Task = require('../models/task');
const User = require('../models/user');

// [GET] /api/tasks - Lấy tất cả tasks của user
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, keyword, collaborator } = req.query;

    // Query cho tasks mà user là owner hoặc collaborator
    const query = {
      $or: [{ user: req.user.id }, { 'collaborators.user': req.user.id }],
    };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add priority filter
    if (priority) {
      query.priority = priority;
    }

    // Add keyword search
    if (keyword) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ title: { $regex: keyword, $options: 'i' } }, { description: { $regex: keyword, $options: 'i' } }],
      });
    }

    // Add collaborator filter
    if (collaborator) {
      query['collaborators.user'] = collaborator;
    }

    const tasks = await Task.find(query)
      .populate('user', 'username email')
      .populate('collaborators.user', 'username email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [GET] /api/tasks/:id - Lấy task theo ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { 'collaborators.user': req.user.id }],
    })
      .populate('user', 'username email')
      .populate('collaborators.user', 'username email');

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [POST] /api/tasks - Tạo task mới
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, collaborators, dueDate, tags } = req.body;

    // Validate collaborators
    let validatedCollaborators = [];
    if (collaborators && collaborators.length > 0) {
      for (let collab of collaborators) {
        const user = await User.findById(collab.user);
        if (user) {
          validatedCollaborators.push({
            user: collab.user,
            role: collab.role || 'viewer',
          });
        }
      }
    }

    const newTask = new Task({
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      user: req.user.id,
      collaborators: validatedCollaborators,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || [],
    });

    const savedTask = await newTask.save();
    await savedTask.populate('user', 'username email');
    await savedTask.populate('collaborators.user', 'username email');

    console.log('User has created Task:', req.user.username);
    res.status(201).json(savedTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [PUT] /api/tasks/:id - Cập nhật task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { 'collaborators.user': req.user.id, 'collaborators.role': { $in: ['editor', 'admin'] } },
      ],
    });

    if (!task) {
      return res.status(404).json({ msg: 'Task not found or no permission' });
    }

    const { title, description, status, priority, collaborators, dueDate, tags } = req.body;

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) task.tags = tags;

    // Update collaborators (only owner can do this)
    if (collaborators !== undefined && task.user.toString() === req.user.id) {
      let validatedCollaborators = [];
      for (let collab of collaborators) {
        const user = await User.findById(collab.user);
        if (user) {
          validatedCollaborators.push({
            user: collab.user,
            role: collab.role || 'viewer',
          });
        }
      }
      task.collaborators = validatedCollaborators;
    }

    await task.save();
    await task.populate('user', 'username email');
    await task.populate('collaborators.user', 'username email');

    console.log('User has updated Task:', req.user.username);
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [DELETE] /api/tasks/:id - Xóa task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id, // Only owner can delete
    });

    if (!task) {
      return res.status(404).json({ msg: 'Task not found or no permission' });
    }

    console.log('User has deleted Task:', req.user.username);
    res.json({ msg: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [PUT] /api/tasks/:id/status - Cập nhật status task
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ user: req.user.id }, { 'collaborators.user': req.user.id }],
      },
      { status },
      { new: true }
    )
      .populate('user', 'username email')
      .populate('collaborators.user', 'username email');

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [POST] /api/tasks/:id/collaborators - Thêm collaborator
exports.addCollaborator = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id, // Only owner can add collaborators
    });

    if (!task) {
      return res.status(404).json({ msg: 'Task not found or no permission' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already collaborator
    const existingCollab = task.collaborators.find((collab) => collab.user.toString() === userId);

    if (existingCollab) {
      return res.status(400).json({ msg: 'User is already a collaborator' });
    }

    task.collaborators.push({
      user: userId,
      role: role || 'viewer',
    });

    await task.save();
    await task.populate('user', 'username email');
    await task.populate('collaborators.user', 'username email');

    res.json(task);
  } catch (err) {
    console.error('Error adding collaborator:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [DELETE] /api/tasks/:id/collaborators/:userId - Xóa collaborator
exports.removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.params;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id, // Only owner can remove collaborators
    });

    if (!task) {
      return res.status(404).json({ msg: 'Task not found or no permission' });
    }

    task.collaborators = task.collaborators.filter((collab) => collab.user.toString() !== userId);

    await task.save();
    await task.populate('user', 'username email');
    await task.populate('collaborators.user', 'username email');

    res.json(task);
  } catch (err) {
    console.error('Error removing collaborator:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
