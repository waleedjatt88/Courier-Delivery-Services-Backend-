
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const agentRoutes = require('./routes/agent.routes.js');
const parcelRoutes = require('./routes/parcel.routes.js');
const paymentRoutes = require('./routes/payment.routes.js');

const paymentController = require('./controllers/payment.controller.js');

const app = express();


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


app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

app.use(express.json());
app.use(cookieParser());




app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/payments', paymentRoutes);


app.get('/', (req, res) => {
  res.status(200).json({ message: 'Courier Backend API is running!' });
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on http://localhost:${PORT}`);

  
  console.log(`Accessible on your network at: http://192.168.100.239:${PORT}`); 
    // console.log(`Accessible on your network at: http://192.168.0.105:${PORT}`); 

});