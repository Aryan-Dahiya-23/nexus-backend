// import mongoose from 'mongoose';

// const conversationSchema = new mongoose.Schema({
//     participants: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//     }],
//     messages: [{
//         senderId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//             required: true,
//         },
//         content: {
//             type: String,
//             required: true,
//         },
//         type: {
//             type: String,
//             enum: ['text', 'media'],
//             default: 'text',
//         },
//         readBy: [{
//             user: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User',
//             },
//             readAt: {
//                 type: Date,
//             },
//         }],
//         createdAt: {
//             type: Date,
//             default: Date.now,
//         },
//     }],
//     lastMessage: {
//         senderId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//         },
//         content: {
//             type: String,
//         },
//         type: {
//             type: String,
//             enum: ['text', 'media'],
//             default: 'text',
//         },
//         createdAt: {
//             type: Date,
//             default: Date.now,
//         },
//     }
// });

// const Conversation = mongoose.model('Conversation', conversationSchema);
// export default Conversation;


import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
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
