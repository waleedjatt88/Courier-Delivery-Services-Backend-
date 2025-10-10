const db = require("../models");
const { Chat } = db;
const jwt = require('jsonwebtoken');

const initializeSocket = (io) => {
  const chatNamespace = io.of('/chat');
  chatNamespace.use((socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication Error: Token not provided.'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication Error: Invalid Token.'));
      }
      socket.user = decoded;
      next();
    });
  });
  chatNamespace.on("connection", (socket) => {
    console.log(`✅ User connected to /chat namespace: ${socket.user.id} (Role: ${socket.user.role})`);
    
    if (socket.user.role === 'customer') {
        const customerId = socket.user.id;
        const roomName = `chat_customer_${customerId}`;
        socket.join(roomName);
        console.log(`Customer ${customerId} auto-joined room: ${roomName}`);
    }
    socket.on("joinAdminChat", (customerId) => {
        if (socket.user.role === 'admin') {
            const roomName = `chat_customer_${customerId}`;
            socket.join(roomName);
            console.log(`Admin ${socket.user.id} joined room for customer ${customerId}`);
        }
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { message, receiverId } = data; 
        const senderId = socket.user.id;
        const senderRole = socket.user.role;
        
        let customerId, adminId;
        let roomName;

        if (senderRole === 'customer') {
            customerId = senderId;
            adminId = receiverId;
            roomName = `chat_customer_${customerId}`;
        } else if (senderRole === 'admin') {
            adminId = senderId;
            customerId = receiverId; 
            roomName = `chat_customer_${customerId}`;
        } else {
            throw new Error("Unauthorized role for sending messages.");
        }

        const newMessage = await Chat.create({
          customerId: customerId,
          adminId: adminId,
          message: message,
          sentBy: senderRole,
        });

        chatNamespace.to(roomName).emit("receiveMessage", newMessage);
        
        console.log(`Message from ${senderRole} ${senderId} sent to room ${roomName}`);

      } catch (error) {
        console.error("Error handling sendMessage:", error);
        socket.emit("chatError", { message: "Failed to send message." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔥 User disconnected from /chat: ${socket.user.id}`);
    });
  });
};

module.exports = initializeSocket;