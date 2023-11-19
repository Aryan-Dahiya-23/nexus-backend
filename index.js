import express from "express";
import http from "http";
import { createServer } from 'node:http';
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { connectToDatabase } from "./config/database.js";
import authRouter from "./routes/auth.js"
import "./config/passport.js"
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";

dotenv.config();

const app = express();
// const server = http.createServer(app);

const origin = process.env.CLIENT_URL
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: origin
    },
});

// Apply middleware

// app.use(session({
//     secret: "your-secret",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         maxAge: 48 * 60 * 60 * 1000,
//     },
// }));

app.use(
    session({
        secret: "your-secret",
        resave: false,
        saveUninitialized: false,

        cookie: {
            secure: process.env.NODE_ENV === "development" ? false : true,
            httpOnly: process.env.NODE_ENV === "development" ? false : true,
            sameSite: process.env.NODE_ENV === "development" ? false : "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    })
);

app.use(cors({ credentials: true, origin: origin }));
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.authenticate("session"));
app.use(passport.initialize());
app.use(passport.session());
app.enable("trust proxy");

connectToDatabase(process.env.MONGO_URL);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (userId) => {
        console.log('userID of message sent: ', userId);
        io.emit('chat message', userId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routers
app.use('/auth', authRouter);

app.get("/people", async (req, res) => {
    const userId = req.query.userId;
    try {
        const people = await User.find({ _id: { $ne: userId } });
        res.json(people);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/create-chat", async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        // const newChat = new Conversation({
        //     participants: [senderId, receiverId],
        //     messages: [],
        //     lastMessage: {
        //         content: "Started The Chat",
        //         createdAt: Date.now()
        //     }
        // });

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
})

app.get('/chats/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.query;

        // const messages = await Conversation.findById(conversationId)
        //     .populate({
        //         path: 'participants',
        //         select: 'fullName picture _id',
        //     })
        //     .populate({
        //         path: 'messages.senderId',
        //         select: 'fullName picture _id',
        //     })
        //     .exec();

        // const conversation = await Conversation.findById(conversationId)
        //     .populate({
        //         path: 'participants',
        //         model: 'User',
        //         select: 'fullName picture',
        //         match: { _id: { $ne: userId } }
        //     })
        //     .populate({
        //         path: 'messages',
        //         model: 'Message'
        //     })
        //     .exec();

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
});

app.post("/createmessage/:conversationId", async (req, res) => {
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
})

app.get("/", (req, res) => {
    res.send("Hello Live Chat App");
});

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});