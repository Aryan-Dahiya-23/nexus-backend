import express from 'express';
import dotenv from "dotenv";
import passport from 'passport';
import User from "../models/User.js"

const router = express.Router();
dotenv.config();

router.get("/login/success", (req, res) => {
    if (req.user) {
        res.status(200).json({
            error: false,
            message: "Successfully Loged In",
            user: req.user,
        });
    } else {
        res.status(403).json({ error: true, message: "Not Authorized" });
    }
});

router.get("/login/failed", (req, res) => {
    res.status(401).json({
        error: true,
        message: "Log in failure",
    });
});

router.get("/google", passport.authenticate("google", ["profile", "email"]));

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureMessage: "Cannot login to Google, please try again later!",
        failureRedirect: `${process.env.CLIENT_URL}/failed`,
        successRedirect: `${process.env.CLIENT_URL}`,
    }),
    (req, res) => {
        res.send("Thank you for signing in!");
    }
);

router.get('/facebook', passport.authenticate('facebook', ["profile", "email"]));

router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {
        failureFlash: "Cannot login to Facebook, please try again later!",
        failureRedirect: `${process.env.CLIENT_URL}/failed`,
        successRedirect: `${process.env.CLIENT_URL}`,
    }),
    function (req, res) {
        res.send("Thank you for signing in!");
    }
);

router.get("/verify", async (req, res) => {
    try {
        if (req.isAuthenticated()) {
            const userId = req.user._id;

            // const user = await User.findById(userId)
            //     .populate({
            //         path: 'messages.userId',
            //         select: 'fullName picture',
            //     })
            //     .populate({
            //         path: 'messages.lastMessage',
            //         select: 'lastMessage.content lastMessage.createdAt',
            //     })
            //     .exec();

            // const user = await User.findById(userId);

            // const user = await User.findById(userId)
            //     .populate({
            //         path: 'conversations.conversationId',
            //         populate: {
            //             path: 'participants',
            //             model: 'User'
            //         }
            //     })
            //     .exec();

            // const user = await User.findById(userId)
            //     .populate({
            //         path: 'conversations.conversationId',
            //         select: 'participants',
            //         populate: {
            //             path: 'participants',
            //             model: 'User',
            //         }
            //     })
            //     .exec();

            // const user = await User.findById(userId)
            //     .populate({
            //         path: 'conversations.conversation',
            //         select: 'participants',
            //         populate: {
            //             path: 'participants',
            //             model: 'User',
            //             select: 'fullName picture',
            //             match: { _id: { $ne: userId } }
            //         }
            //     })
            //     .exec();

            const user = await User.findById(userId)
                .populate({
                    path: 'conversations.conversation',
                    select: 'participants lastMessage',
                    populate: [
                        {
                            path: 'participants',
                            model: 'User',
                            select: 'fullName picture',
                            match: { _id: { $ne: userId } }
                        },
                        {
                            path: 'lastMessage',
                            model: 'Message',
                            select: 'content createdAt'
                        }
                    ]
                })
                .exec();

            // for (let i = 0; i < user.conversations.length; i++) {
            //     console.log(user.conversations[i].conversation);
            // }

            // user.conversations.sort((a, b) => {
            //     const createdAtA = a.conversation.lastMessage.createdAt;
            //     const createdAtB = b.conversation.lastMessage.createdAt;
            //     return createdAtB - createdAtA;
            // });

            user.conversations.sort((a, b) => {
                const lastMessageA = a.conversation.lastMessage;
                const lastMessageB = b.conversation.lastMessage;

                if (!lastMessageA && !lastMessageB) {
                    return 0;
                }

                if (!lastMessageA) {
                    return -1;
                }

                if (!lastMessageB) {
                    return 1;
                }

                const createdAtA = lastMessageA.createdAt;
                const createdAtB = lastMessageB.createdAt;

                return createdAtB - createdAtA;
            });


            res.status(200).json({
                error: false,
                message: "Successfully Logged In",
                user: user,
            });
        } else {
            res.status(403).json({
                error: true,
                message: "Not Authorized",
                reason: "User is not authenticated.",
            });
        }
    } catch (error) {
        res.status(500).json({
            error: true,
            message: "Internal Server Error",
            reason: "An error occurred while verifying user authentication.",
        });
    }
});

router.post('/logout', (req, res, next) => {

    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                error: true,
                message: 'Internal Server Error during logout',
            });
        }

        res.status(204).end();
    });
});

export default router