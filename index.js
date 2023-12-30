import express from "express";
import { createServer } from 'node:http';
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { connectToDatabase } from "./config/database.js";
import initializeChatSockets from "./sockets/chatSockets.js";
import "./config/passport.js"
import authRouter from "./routes/auth.js"
import conversationRouter from "./routes/conversation.js"

dotenv.config();

const app = express();

const origin = process.env.CLIENT_URL
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: origin
    },
});

app.use(
    session({
        secret: process.env.SECRET_KEY,
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

initializeChatSockets(io);

// Routers
app.use('/auth', authRouter);
app.use('/conversation', conversationRouter);

app.get("/", (req, res) => {
    res.send("Hello Live Chat App");
});

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});