const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../models');
const CONFIG = require('../config');

module.exports = (passport) => {
  // JWT Strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: CONFIG.JWT_TOKEN,
      },
      async (jwtPayload, done) => {
        try {
          const user = await db.PlatformUser.findByPk(jwtPayload.id);
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          console.log('passpoert.use', err);
          return done(err, false);
        }
      }
    )
  );

  // Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await db.PlatformUser.findOne({
            where: { email, provider: 'local' },
          });
          if (!user) return done(null, false, { message: 'No user found' });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch)
            return done(null, false, { message: 'Incorrect password' });

          return done(null, user);
        } catch (err) {
          console.log('error in localstrategy', err);
          return done(err);
        }
      }
    )
  );

  // Google OAuth
  passport.use(
    new GoogleStrategy(
      {
        clientID: CONFIG.GOOGLE_CLIENT_ID,
        clientSecret: CONFIG.GOOGLE_CLIENT_SECRET,
        callbackURL: `${CONFIG.shopify.appUrl}/platform/auth/google/callback`,
        passReqToCallback: true, // Important
      },
      async (req, accessToken, refreshToken, profile, done) => {
        const fp_ref = req.session.fp_ref; // This will work now
        console.log('fp_ref in Google Strategy:', fp_ref);
        try {
          let user = await db.PlatformUser.findOne({
            where: { providerId: profile.id, provider: 'google' },
          });
          if (!user) {
            user = await db.PlatformUser.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              provider: 'google',
              providerId: profile.id,
            });
          }
          return done(null, user);
        } catch (err) {
          console.error('error in googlesrategy', err);
          return done(err);
        }
      }
    )
  );

  // Facebook OAuth
  passport.use(
    new FacebookStrategy(
      {
        clientID: CONFIG.FACEBOOK_CLIENT_ID,
        clientSecret: CONFIG.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${CONFIG.shopify.appUrl}/platform/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await db.PlatformUser.findOne({
            where: { providerId: profile.id, provider: 'facebook' },
          });
          if (!user) {
            user = await db.PlatformUser.create({
              name: profile.displayName,
              email: profile.emails ? profile.emails[0].value : null,
              provider: 'facebook',
              providerId: profile.id,
            });
          }
          return done(null, user);
        } catch (err) {
          console.log('error in faacebokstartegy', err);
          return done(err);
        }
      }
    )
  );

  // Serialize and Deserialize User (Only needed for session-based auth)
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.PlatformUser.findByPk(id);
      done(null, user);
    } catch (err) {
      console.log('error in deserialize', err);
      done(err);
    }
  });
};
