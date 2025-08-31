const Message = require('../models/message');
const User = require('../models/user');

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'username email')
    .populate('receiver', 'username email')
    .sort({ createdAt: 1 })
    .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    if (!content || !receiverId) {
      return res.status(400).json({ message: 'Content and receiver are required' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email')
      .populate('receiver', 'username email');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const receiverId = req.user.id;

    await Message.updateMany(
      { sender: senderId, receiver: receiverId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const allUsers = await User.find({}).select('username email');

    const allMessages = await Message.find({}).select('sender receiver');

    const sentMessages = await Message.distinct('receiver', { sender: currentUserId });
    const receivedMessages = await Message.distinct('sender', { receiver: currentUserId });
  

    const allUserIds = [...new Set([...sentMessages, ...receivedMessages])];

    const otherUserIds = allUserIds.filter(id => id.toString() !== currentUserId);

    const users = await User.find({ 
      _id: { $in: otherUserIds } 
    })
    .select('username email')
    .sort({ username: 1 });
    
    

    const chatUsers = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId }
          ]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username')
        .populate('receiver', 'username');

        const unreadCount = await Message.countDocuments({
          sender: user._id,
          receiver: currentUserId,
          isRead: false
        });

        return {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sender: lastMessage.sender.username,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );

    chatUsers.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(chatUsers);
  } catch (error) {
    console.error('Error getting chat users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    const currentUserId = req.user.id;    

    if (!email || email.trim().length < 2) {
      return res.status(400).json({ message: 'Email must be at least 2 characters' });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      email: { $regex: email, $options: 'i' }
    })
    .select('username email')
    .limit(10);
    
    const searchResults = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId }
          ]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username')
        .populate('receiver', 'username');

        const unreadCount = await Message.countDocuments({
          sender: user._id,
          receiver: currentUserId,
          isRead: false
        });

        return {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sender: lastMessage.sender.username,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: currentUserId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const testDatabase = async (req, res) => {
  try {
    const allUsers = await User.find({}).select('username email _id');
    const allMessages = await Message.find({}).select('sender receiver content');
    
    res.json({
      users: allUsers,
      messages: allMessages,
      userCount: allUsers.length,
      messageCount: allMessages.length
    });
  } catch (error) {
    console.error('Error testing database:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  getChatUsers,
  searchUsers,
  getUnreadCount,
  testDatabase
};
