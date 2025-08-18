// src/app.js - UPDATED WITH PARCEL ROUTES

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

// Aapka routes ko require karne ka tareeka bilkul theek hai
let authRoutes;
let userRoutes;
let adminRoutes;
let parcelRoutes; 
try {
    authRoutes = require('./routes/auth.routes.js');
    userRoutes = require('./routes/user.routes.js');
    adminRoutes = require('./routes/admin.routes.js');
    parcelRoutes = require('./routes/parcel.routes.js'); 
     agentRoutes = require('./routes/agent.routes.js'); 
} catch (error) {
    console.error("!!! FATAL ERROR while requiring routes:", error);
    process.exit(1); 
}

const app = express();

// =========================================================================
//                          CORS SETUP YAHAN HAI
// =========================================================================

const allowedOrigins = [
    'http://localhost:3000', // Frontend 1
    'http://localhost:5173',  // Frontend 2
    // 'http://localhost:5174'  // Frontend 3
];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('This origin is not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));


// Baaki ke Middlewares
app.use(express.json());
app.use(cookieParser());

// API Routes ko Register Karein
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/parcels', parcelRoutes);
// =====================================

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Courier Backend API is running!' });
});

const PORT = process.env.PORT || 3000;

// Server Listen 
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is listening on http://localhost:${PORT}`);
//   console.log(`Accessible on your network at: http://10.101.85.13:${PORT}`);

  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
  console.log(`Accessible on your network at: http://192.168.100.244:${PORT}`);


});