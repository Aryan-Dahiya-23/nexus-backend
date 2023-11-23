import User from "../models/User.js";

export const verify = async (req, res) => {
    try {
        if (req.isAuthenticated()) {
            const userId = req.user._id;

            const user = await User.findById(userId).lean()
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
                            select: 'content createdAt seenBy'
                        }
                    ]
                })
                .exec();

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
}

export const logout = async (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                error: true,
                message: 'Internal Server Error during logout',
            });
        }

        res.status(204).end();
    });
}