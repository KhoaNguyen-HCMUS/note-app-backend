const Note = require('../models/note');

// [GET] /api/notes - Lấy tất cả ghi chú của user
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi server' });
  }
};

// [POST] /api/notes - Tạo ghi chú mới
exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({
      title,
      content,
      user: req.user.id,
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi server' });
  }
};

// [PUT] /api/notes/:id - Cập nhật ghi chú
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ msg: 'Không tìm thấy ghi chú' });

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi server' });
  }
};

// [DELETE] /api/notes/:id - Xóa ghi chú
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ msg: 'Không tìm thấy ghi chú' });

    res.json({ msg: 'Đã xóa ghi chú' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi server' });
  }
};
