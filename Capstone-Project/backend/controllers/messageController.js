import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all conversations for logged-in user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 }); // Sort by recent activity

    // Format response to include other participant and unread count
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        otherUser: otherParticipant,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages in a conversation (with a user)
// @route   GET /api/messages/user/:userId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params; // <-- CHANGED
    const myUserId = req.user._id; // <-- ADDED
    const { page = 1, limit = 50 } = req.query; // Pagination

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(myUserId, otherUserId); // <-- CHANGED

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const conversationId = conversation._id; // <-- ADDED

    // Verify user is part of conversation (already guaranteed by findOrCreate)

    // Fetch messages with pagination
    const messages = await Message.find({ conversationId }) // <-- CHANGED
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Count total messages
    const totalMessages = await Message.countDocuments({ conversationId }); // <-- CHANGED

    res.status(200).json({
      success: true,
      count: messages.length,
      totalMessages,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      data: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for user list)
// @route   GET /api/messages/users
// @access  Private
export const getUsers = async (req, res, next) => {
  try {
    // Get all users except current user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar isOnline lastSeen')
      .sort({ isOnline: -1, username: 1 }); // Online users first

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

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
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};