
const dotenv = require("dotenv");
dotenv.config();

//Libraries
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require('http');
const { Server } = require("socket.io");
const passport = require("passport");

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
const initializeSocket = require('./socket-handler.js');
require("./config/passport-setup.js"); 

// SERVER & SOCKET.IO SETUP
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',      
    'http://localhost:5174',      
    'http://127.0.0.1:5500',      
    'http://192.168.100.120:5173', 
];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(new Error('This origin is not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"]
    }
});

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
app.use(passport.initialize());

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


app.get("/", (req, res) => {
  res.status(200).json({ message: "Courier Backend API is running!" });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO is also running.`);
  console.log(`Accessible on your network at: http://192.168.100.120:${PORT}`);
});