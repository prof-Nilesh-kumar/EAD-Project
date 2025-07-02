const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const config = require("./config")
const EmployeeModel = require("./models/Employee")

const app = express()

// Middleware
app.use(express.json())
app.use(cors(config.cors))

// Connect to MongoDB with better error handling
mongoose.connect(config.mongodb.uri, config.mongodb.options)
    .then(() => {
        console.log('✅ MongoDB connected successfully!')
        console.log('📊 Database:', mongoose.connection.name)
        console.log('🌐 Host:', mongoose.connection.host)
        console.log('🔌 Port:', mongoose.connection.port)
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message)
        process.exit(1) // Exit if cannot connect to database
    })

// MongoDB Connection Event Listeners
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB')
})

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close()
        console.log('📴 MongoDB connection closed through app termination')
        process.exit(0)
    } catch (err) {
        console.error('❌ Error during shutdown:', err)
        process.exit(1)
    }
})

// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime(),
        version: config.api.version
    })
})

// Authentication Routes
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const user = await EmployeeModel.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }
        
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            res.json({ 
                message: "Success",
                user: user.getPublicProfile()
            });
        } else {
            res.status(401).json({ 
                error: 'Invalid password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
})

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Name, email, and password are required' 
            });
        }

        // Check if user already exists
        const existingUser = await EmployeeModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ 
                error: 'User with this email already exists' 
            });
        }

        const newUser = await EmployeeModel.create({ name, email, password });
        res.status(201).json({
            message: 'User created successfully',
            user: newUser.getPublicProfile()
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
})

// User Management Routes
app.get('/users', async (req, res) => {
    try {
        const users = await EmployeeModel.find();
        res.json(users); // Password is automatically excluded by schema
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users' 
        });
    }
})

app.put('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email) {
            return res.status(400).json({ 
                error: 'Name and email are required' 
            });
        }

        const updatedUser = await EmployeeModel.findByIdAndUpdate(
            id, 
            { name, email, password }, 
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }
        
        res.json({
            message: 'User updated successfully',
            user: updatedUser.getPublicProfile()
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ 
            error: 'Failed to update user' 
        });
    }
})

app.delete('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedUser = await EmployeeModel.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }
        
        res.json({ 
            message: 'User deleted successfully',
            user: deletedUser.getPublicProfile()
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            error: 'Failed to delete user' 
        });
    }
})

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: config.api.name,
        version: config.api.version,
        status: "running",
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: config.nodeEnv
    });
})

// Start server
app.listen(config.port, () => {
    console.log(`🚀 Server is running on PORT: ${config.port}`)
    console.log(`📡 Health check: http://localhost:${config.port}/health`)
    console.log(`🌐 API Base URL: http://localhost:${config.port}`)
    console.log(`🔧 Environment: ${config.nodeEnv}`)
})
