import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.query;

        const conversation = await Conversation.findById(conversationId).lean()
            .populate({
                path: 'participants',
                model: 'User',
                select: 'fullName picture',
                match: { _id: { $ne: userId } }
            })
            .populate({
                path: 'messages',
                model: 'Message',
                populate: {
                    path: 'senderId',
                    model: 'User',
                    select: 'fullName picture',
                }
            })
            .exec();

        res.json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const createConversation = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        const newChat = new Conversation({
            participants: [senderId, receiverId],
            messages: [],
        });

        const savedChat = await newChat.save();

        await User.updateOne(
            { _id: senderId },
            {
                $push: {
                    conversations: {
                        conversation: savedChat._id,
                    },
                },
            }
        );

        await User.updateOne(
            { _id: receiverId },
            {
                $push: {
                    conversations: {
                        conversation: savedChat._id,
                    },
                },
            }
        );

        res.status(201).json({
            error: false,
            message: 'Chat created successfully',
            chat: savedChat,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: true,
            message: 'Internal Server Error',
            reason: 'An error occurred while creating the chat.',
        });
    }
}

export const createMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;

        const newMessage = await Message.create(message);

        const conversation = await Conversation.findById(conversationId);

        conversation.messages.push(newMessage._id);
        conversation.lastMessage = newMessage._id;

        await conversation.save();

        return res.status(200).json({ message: "Message created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}