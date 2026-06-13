const mongoose = require('mongoose');

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pramanik';

    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        // Don't exit process in production/serverless environment
    }
}

module.exports = connectDB;