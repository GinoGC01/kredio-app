export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || '',
  directUrl: process.env.DIRECT_URL || '',
  nodeEnv: process.env.NODE_ENV || 'dev',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isDev: (process.env.NODE_ENV || 'dev') === 'dev',
  inactivityMs: parseInt(process.env.INACTIVITY_MS || '7200000', 10),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleSecretKey: process.env.GOOGLE_SECRET_KEY || '',
};

export const cookieOptions = {
  httpOnly: !env.isDev,
  secure: !env.isDev,
  sameSite: (env.isDev ? 'lax' : 'strict') as 'lax' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
