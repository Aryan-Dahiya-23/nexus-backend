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
import conversationRouter from "./routes/conversation.js"
import "./config/passport.js"
import User from "./models/User.js";

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
    // console.log('a user connected');

    socket.on('chat message', (userId, newMessage, conversationId) => {
        io.emit('chat message', userId, newMessage, conversationId);
    });

    socket.on('disconnect', () => {
        // console.log('User disconnected');
    });
});

// Routers
app.use('/auth', authRouter);
app.use('/conversation', conversationRouter);

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

app.get("/", (req, res) => {
    res.send("Hello Live Chat App");
});

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});