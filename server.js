const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173" || "https://lument-note.vercel.app",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
  console.log('API is running...');
});

// Socket.IO middleware để xác thực
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);
  
  // Join user to their personal room
  socket.join(socket.userId);

  // Handle private message
  socket.on('private_message', async (data) => {
    try {
      const { receiverId, content, messageType = 'text' } = data;
      
      // Emit to receiver
      socket.to(receiverId).emit('new_message', {
        senderId: socket.userId,
        senderName: socket.username,
        content,
        messageType,
        timestamp: new Date()
      });

      // Emit back to sender for confirmation
      socket.emit('message_sent', {
        receiverId,
        content,
        messageType,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.receiverId).emit('user_typing', {
      userId: socket.userId,
      username: socket.username
    });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    socket.to(data.receiverId).emit('user_stop_typing', {
      userId: socket.userId
    });
  });

  // Handle user online status
  socket.on('user_online', () => {
    socket.broadcast.emit('user_status', {
      userId: socket.userId,
      status: 'online'
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username} (${socket.userId})`);
    socket.broadcast.emit('user_status', {
      userId: socket.userId,
      status: 'offline'
    });
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ MongoDB connected and pinged successfully');

      const PORT = process.env.PORT || 5000;
      server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (error) {
      console.error('❌ Ping failed:', error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
