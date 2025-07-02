// Configuration file for the MERN User Management System

const config = {
    // Server Configuration
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // MongoDB Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || "mongodb+srv://shivambscsses21:UAgZxVPTGrZITr3d@cluster0.bxqebzj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        options: {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },
    
    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
    },
    
    // Security Configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        jwtExpire: process.env.JWT_EXPIRE || '24h'
    },
    
    // API Configuration
    api: {
        version: '1.0.0',
        name: 'MERN User Management System API'
    }
}

module.exports = config