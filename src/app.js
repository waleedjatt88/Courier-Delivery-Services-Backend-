const dotenv = require("dotenv");
dotenv.config();

//Libraries
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require('http');
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const redisClient = require("./config/redis-client.js"); 
const jwt = require('jsonwebtoken'); 


//(Routes, Controllers)
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const agentRoutes = require("./routes/agent.routes.js");
const parcelRoutes = require("./routes/parcel.routes.js");
const paymentRoutes = require("./routes/payment.routes.js");
const ticketRoutes = require("./routes/ticket.routes.js");
const chatRoutes = require('./routes/chat.routes.js');
const paymentController = require("./controllers/payment.controller.js");
const publicRoutes = require('./routes/public.routes.js');
const { autoRejectJob,unsuspendUsers } = require('./scheduler.js');
const reportingRoutes = require("./routes/reporting.routes.js");                  
const weightSlabRoutes = require("./routes/weightslab.routes.js"); 
const initializeSocket = require('./socket-handler.js');

// SERVER & SOCKET.IO SETUP
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    'http://localhost:5173',      
    'http://localhost:5174',      
    'http://localhost:3000', 
    'http://localhost:5500',   
    'http://127.0.0.1:5500',  
];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(new Error('This origin is not allowed by CORS'));
            }},
        methods: ["GET", "POST"]
    }
});

const pubClient = redisClient;
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
console.log("Socket.IO adapter is set to Redis.");




initializeSocket(io);
app.set('socketio', io);

// MIDDLEWARE SETUP
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

//global middlewares
app.use(express.json()); 
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

//API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api', publicRoutes);
app.use("/api/reporting", reportingRoutes);
app.use("/api/admin/weight-slabs", weightSlabRoutes); 

app.get("/", (req, res) => {
  res.status(200).json({ message: "Courier Backend API is running!" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  autoRejectJob.start();
  unsuspendUsers.start();
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`🌍 Public (ngrok) URL: https://nevaeh-spissatus-nonbelievingly.ngrok-free.dev`);

  console.log(`📡 Socket.IO is also running.`);
});