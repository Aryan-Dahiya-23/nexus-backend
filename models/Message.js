import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'media'],
        default: 'text',
    },
    seenBy: [],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model('Message', messageSchema);
export default Message;