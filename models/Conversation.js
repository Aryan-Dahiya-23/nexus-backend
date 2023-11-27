import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    type: {
        type: String
    },
    name: {
        type: String
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
