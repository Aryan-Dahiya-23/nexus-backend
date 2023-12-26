import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    googleId: {
        type: String,
        default: null,
    },
    facebookId: {
        type: String,
        default: null,
    },
    picture: {
        type: String,
    },
    conversations: [{
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);
export default User;