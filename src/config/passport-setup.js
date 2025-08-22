const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../../models');
const User = db.User;

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ where: { email: profile.emails[0].value } });

            if (user) {
                done(null, user);
            } else {
                const newUser = await User.create({
                    fullName: profile.displayName,
                    email: profile.emails[0].value,
                    phoneNumber: '0000000000', 
                    passwordHash: 'provided_by_google', 
                    role: 'customer',
                    isVerified: true 
                });
                done(null, newUser);
            }
        } catch (error) {
            done(error, null);
        }
    })
);