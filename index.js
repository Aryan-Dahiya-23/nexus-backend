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

dotenv.config();

const app = express();
// const server = http.createServer(app);

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    },
});

// Apply middleware
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 48 * 60 * 60 * 1000,
    },
}));

app.use(passport.initialize());
app.use(passport.session());

connectToDatabase(process.env.MONGO_URL);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (userId) => {
        console.log('userID: ', userId);
        io.emit('chat message' ,userId);
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

        const newChat = new Conversation({
            participants: [senderId, receiverId],
            messages: [],
            lastMessage: {
                content: "Started The Chat",
                createdAt: Date.now()
            }
        });

        const savedChat = await newChat.save();

        await User.updateOne(
            { _id: senderId },
            {
                $push: {
                    messages: {
                        userId: receiverId,
                        conversationId: savedChat._id,
                        lastMessage: savedChat._id,
                    },
                },
            }
        );

        await User.updateOne(
            { _id: receiverId },
            {
                $push: {
                    messages: {
                        userId: senderId,
                        conversationId: savedChat._id,
                        lastMessage: savedChat._id,
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

        const messages = await Conversation.findById(conversationId)
            .populate({
                path: 'participants',
                select: 'fullName picture _id',
            })
            .populate({
                path: 'messages.senderId',
                select: 'fullName picture _id',
            })
            .exec();

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/createmessage/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;

        const conversation = await Conversation.findById(conversationId);
        conversation.messages.push(message);

        conversation.lastMessage = {
            ...message,
            createdAt: Date.now()
        };

        await conversation.save();

        return res.status(200).json({ message: "Message created successfully" });
    } catch (error) {
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