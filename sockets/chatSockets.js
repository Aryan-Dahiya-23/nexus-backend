const connectedUsers = new Map();

const sendConnectedUsersToClients = (io) => {
    const connectedUserIds = Array.from(connectedUsers.values());
    io.emit('connected users', connectedUserIds);
};

const initializeChatSockets = (io) => {
    io.on('connection', (socket) => {

        socket.on('user connected', (userId) => {
            console.log(`User with ID ${userId} connected`);
            connectedUsers.set(socket.id, userId);
            sendConnectedUsersToClients(io);
            console.log(connectedUsers);
        });

        socket.on('chat message', (userId, newMessage, conversationId) => {
            io.emit('chat message', userId, newMessage, conversationId);
        });

        socket.on('message sent', (userId, conversationId) => {
            io.emit('message sent', userId, conversationId);
        });

        socket.on('seen message', (conversationId) => {
            io.emit('seen message', conversationId);
        });

        socket.on('new conversation', (userId) => {
            io.emit('new conversation', userId);
        })

        socket.on('video call', (name, avatarSrc, userId, id) => {
            // socket.broadcast.to(socket.room).emit('receive video call invitation', name, avatarSrc, id);

            console.log(avatarSrc);
            io.emit('video call', name, avatarSrc, userId, id);
        })

        socket.on('disconnect', () => {
            const userId = connectedUsers.get(socket.id);
            if (userId) {
                console.log(`User with ID ${userId} disconnected`);
                connectedUsers.delete(socket.id);
                console.log(connectedUsers);
                sendConnectedUsersToClients(io);
            }
        });
    });
};

export default initializeChatSockets;