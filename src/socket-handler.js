const db = require("../models");
const { Chat, User } = db;
const jwt = require('jsonwebtoken');

const ADMIN_ROOM = 'admin_room';
const onlineCustomers = new Map();

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
  chatNamespace.on("connection", async (socket) => { 
    console.log(`✅ User connected to /chat namespace: ${socket.user.id} (Role: ${socket.user.role})`);

    if (socket.user.role === 'admin') {
        socket.join(ADMIN_ROOM);
        console.log(`Admin ${socket.user.id} joined the admin room.`);
        socket.emit('update_online_list', Array.from(onlineCustomers.values()));
    }
    

    if (socket.user.role === 'customer') {
        const customerId = socket.user.id;
        const roomName = `chat_customer_${customerId}`;
        socket.join(roomName);
        console.log(`Customer ${customerId} auto-joined room: ${roomName}`);

           const customer = await User.findByPk(customerId, { attributes: ['id', 'fullName'] });
        if (customer && !onlineCustomers.has(customerId)) {
            onlineCustomers.set(customerId, customer.toJSON());
            chatNamespace.to(ADMIN_ROOM).emit('update_online_list', Array.from(onlineCustomers.values()));
            console.log(`Customer ${customerId} is now online. Total online: ${onlineCustomers.size}`);
    }
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
    if (senderRole === 'customer') {
        customerId = senderId;
        adminId = receiverId; 
    } else if (senderRole === 'admin') {
        adminId = senderId;
        customerId = receiverId; 
    } else {
        throw new Error("Unauthorized role for sending messages.");
    }
    const roomName = `chat_customer_${customerId}`;

    if (senderRole === 'admin') {
      await Chat.update(
        { isReadByAdmin: true },
        {
          where: {
            customerId: customerId,
            isReadByAdmin: false
          }
        }
      );
      console.log(`Marked all messages from customer ${customerId} as read due to admin reply.`);
    }
    const isReadByAdmin = (senderRole === 'admin'); 
    const newMessage = await Chat.create({
      customerId: customerId,
      adminId: adminId,
      message: message,
      sentBy: senderRole,
      isReadByAdmin: isReadByAdmin
    });
    chatNamespace.to(roomName).emit("receiveMessage", newMessage);
    if (senderRole === 'customer') {
      chatNamespace.to('admin_room').emit('new_unread_message', { customerId: customerId });
    } else if (senderRole === 'admin') {
      chatNamespace.to('admin_room').emit('update_unread_count', { customerId: customerId, unreadCount: 0 });
    }

    console.log(`Message from ${senderRole} ${senderId} sent to room ${roomName}`);

  } catch (error) {
    console.error("Error handling sendMessage:", error);
    socket.emit("chatError", { message: "Failed to send message." });
  }
});
    socket.on("disconnect", () => {
      console.log(`🔥 User disconnected from /chat: ${socket.user.id}`);
      
      if (socket.user.role === 'customer') {
          const customerId = socket.user.id;
          if (onlineCustomers.has(customerId)) {
              onlineCustomers.delete(customerId);
              chatNamespace.to(ADMIN_ROOM).emit('update_online_list', Array.from(onlineCustomers.values()));
              console.log(`Customer ${customerId} went offline. Total online: ${onlineCustomers.size}`);
          }
      }
    });

  });

};


module.exports = initializeSocket;