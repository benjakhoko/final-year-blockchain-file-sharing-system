const config = {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    
    corsOptions: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        optionsSuccessStatus: 200
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },

    upload: {
        maxSize: process.env.MAX_FILE_SIZE || 10485760,
        path: process.env.UPLOAD_PATH || 'uploads/'
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d'
    },

    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
    }
};

module.exports = config;