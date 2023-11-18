import mongoose from 'mongoose';

export const connectToDatabase = async (databaseUrl) => {
    try {
        await mongoose.connect(databaseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};