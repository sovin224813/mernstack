import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const userSocketMap = new Map();

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

export const initializeSocket = (io) => {
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    userSocketMap.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    io.emit('userOnline', {
      userId: userId,
      username: socket.user.username,
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, content } = data;

        if (!receiverId || !content || content.trim().length === 0) {
          return socket.emit('error', { message: 'Invalid message data' });
        }

        const conversation = await Conversation.findOrCreate(userId, receiverId);

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content.trim(),
          conversationId: conversation._id,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar');

        conversation.lastMessage = populatedMessage._id;
        conversation.unreadCount.set(
          receiverId,
          (conversation.unreadCount.get(receiverId) || 0) + 1
        );
        await conversation.save();

        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', populatedMessage);
        }

        socket.emit('messageSent', populatedMessage);

        console.log(`📩 Message from ${socket.user.username} to ${receiverId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      const { receiverId } = data;
      const receiverSocketId = userSocketMap.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', {
          userId: userId,
          username: socket.user.username,
        });
      }
    });

    socket.on('stopTyping', (data) => {
      const { receiverId } = data;
      const receiverSocketId = userSocketMap.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userStoppedTyping', {
          userId: userId,
        });
      }
    });

    socket.on('markAsRead', async (data) => {
      try {
        const { conversationId } = data;

        await Message.updateMany(
          {
            conversationId,
            receiver: userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        const conversation = await Conversation.findById(conversationId);
        conversation.unreadCount.set(userId, 0);
        await conversation.save();

        const otherUserId = conversation.participants.find(
          (id) => id.toString() !== userId
        ).toString();

        const otherUserSocketId = userSocketMap.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('messagesRead', { conversationId });
        }
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);

      userSocketMap.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit('userOffline', {
        userId: userId,
        lastSeen: new Date(),
      });
    });
  });
};

export const getOnlineUsers = () => {
  return Array.from(userSocketMap.keys());
};