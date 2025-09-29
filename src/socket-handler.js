const db = require("../models");
const { Chat } = db;

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅SUCCESS! A new client has connected: ${socket.id}`);

    socket.on("joinChat", (customerId) => {
      const roomName = `chat_customer_${customerId}`;
      socket.join(roomName);
      console.log(`Client ${socket.id} joined room: ${roomName}`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { customerId, adminId, message, sentBy } = data;

        const newMessage = await Chat.create({
          customerId,
          adminId,
          message,
          sentBy,
          clearedByCustomer: false,
        });

        const roomName = `chat_customer_${customerId}`;
        io.to(roomName).emit("receiveMessage", newMessage);
        console.log(`Message sent to room ${roomName}:`, newMessage.message);
      } catch (error) {
        console.error("Error handling sendMessage:", error);
        socket.emit("chatError", { message: "Failed to send message." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔥 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;
