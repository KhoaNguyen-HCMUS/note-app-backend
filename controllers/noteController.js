const Note = require('../models/note');

// [GET] /api/notes - Lấy tất cả ghi chú của user
exports.getNotes = async (req, res) => {
  try {
    const { tag, keyword } = req.query;
    const query = { user: req.user.id };

    // Add tag filter if provided
    if (tag) {
      query.tags = tag;
    }

    // Add keyword search if provided
    if (keyword) {
      query.$or = [{ title: { $regex: keyword, $options: 'i' } }, { content: { $regex: keyword, $options: 'i' } }];
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [POST] /api/notes - Tạo ghi chú mới
exports.createNote = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const newNote = new Note({
      title,
      content,
      user: req.user.id,
      tags: tags || [],
    });

    const savedNote = await newNote.save();
    console.log('User has created Note');
    res.status(201).json(savedNote);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [PUT] /api/notes/:id - Cập nhật ghi chú
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ msg: 'Note not found' });

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    note.tags = req.body.tags || note.tags;
    await note.save();

    console.log('User has updated Note');
    res.json(note);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// [DELETE] /api/notes/:id - Xóa ghi chú
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ msg: 'Note not found' });

    console.log('User has deleted Note:', req.user.username);
    res.json({ msg: 'Successful deletion' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
