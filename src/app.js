// src/app.js - FINAL CLEANED UP & CORRECTED VERSION

// Step 1: Sabse Pehle Environment Variables Load Karein
const dotenv = require('dotenv');
dotenv.config();

// Step 2: Baaki ki Libraries
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Step 3: Ab Saare Apne Modules (Routes aur Controllers) Load Karein
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const agentRoutes = require('./routes/agent.routes.js');
const parcelRoutes = require('./routes/parcel.routes.js');
const paymentRoutes = require('./routes/payment.routes.js');
// Webhook ke liye controller ko alag se import karein
const paymentController = require('./controllers/payment.controller.js');

// Express App ko Initialize Karein
const app = express();

// =========================================================================
//                          MIDDLEWARE SETUP
// =========================================================================

// CORS Setup
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    // 'http://localhost:5174'
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


// --- WEBHOOK ROUTE (Yahan par iski sahi jagah hai) ---
// Is route ko express.json() se PEHLE define karna laazmi hai.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
// --------------------------------------------------


// Baaki ke Global Middlewares
// express.json() middleware aane wali har request ki body ko JSON object mein badal deta hai
app.use(express.json());
app.use(cookieParser());


// =========================================================================
//                          API ROUTES
// =========================================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/payments', paymentRoutes);


// Default Test Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Courier Backend API is running!' });
});


// =========================================================================
//                          SERVER START
// =========================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
  // Yahan apna IP address daalein
  console.log(`Accessible on your network at: http://192.168.100.244:${PORT}`); 
});