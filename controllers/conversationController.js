import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import NodeCache from 'node-cache';
const nodeCache = new NodeCache();

export const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.query;

        let conversation;

        if (nodeCache.has(conversationId)) {
            console.log('conversation cached');
            conversation = nodeCache.get(conversationId);
        } else {
            console.log('not cached');
            conversation = await Conversation.findById(conversationId).lean()
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
                .populate({
                    path: 'lastMessage',
                    model: 'Message',
                    select: 'content senderId seenBy'
                })
                .exec();

            nodeCache.set(conversationId, conversation);
        }

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
            type: 'personal',
            participants: [senderId, receiverId],
            messages: [],
        });

        const savedChat = await newChat.save();

        await User.updateMany(
            { _id: { $in: [senderId, receiverId] } },
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

export const createGroupConversation = async (req, res) => {
    try {
        const { participants, name } = req.body;

        const newChat = new Conversation({
            type: 'group',
            name: name,
            participants: participants,
            messages: [],
        });

        const savedChat = await newChat.save();

        await User.updateMany(
            { _id: { $in: participants } },
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
        nodeCache.del(conversationId);

        return res.status(200).json({ message: "Message created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const readMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;

        const conversation = await Conversation.findById(conversationId);
        const message = await Message.findById(conversation.lastMessage);

        if (message.senderId !== userId && !message.seenBy.includes(userId)) {
            message.seenBy.push(userId);
            await message.save();
            nodeCache.del(conversationId);
        }
        // console.log(message);
        res.status(200).json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}