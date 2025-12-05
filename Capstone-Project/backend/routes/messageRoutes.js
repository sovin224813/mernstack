import express from 'express';
import {
  getConversations,
  getMessages,
  getUsers,
  markAsRead,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/users', getUsers);
router.get('/user/:userId', getMessages);
router.put('/read/:conversationId', markAsRead);

export default router;
