const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../../models');
const User = db.User;
const sendEmail = require('../services/notification.service.js');

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

                 try {
                    await sendEmail({
                        email: newUser.email,
                        subject: `Welcome to DevGo, ${newUser.fullName}!`,
                        template: 'welcomeGoogleUser',
                        data: {
                            fullName: newUser.fullName,
                            dashboardUrl: 'http://localhost:/dashboard' 
                        }
                    });
                } catch (emailError) {
                    console.error("Could not send welcome email to Google user:", emailError);
                }
                done(null, newUser);
            }
        } catch (error) {
            done(error, null);
        }
    })
);