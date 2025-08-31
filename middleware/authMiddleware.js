const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token thiếu hoặc không hợp lệ' });
  }
  try {
    const token = authHeader.split(' ')[1]; // Get token after "Bearer"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token không hợp lệ' });
  }
};

module.exports = { protect };
