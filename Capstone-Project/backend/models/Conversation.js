import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next();
});

conversationSchema.index({ participants: 1 });

conversationSchema.statics.findOrCreate = async function (user1Id, user2Id) {
  const participants = [user1Id, user2Id].sort();

  let conversation = await this.findOne({
    participants: { $all: participants },
  });

  if (!conversation) {
    conversation = await this.create({
      participants,
      unreadCount: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
    });
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
