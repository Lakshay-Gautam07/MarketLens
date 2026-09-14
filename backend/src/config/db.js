'use strict';

const mongoose = require('mongoose');

/**
 * Opens a connection to MongoDB using the URI defined in MONGODB_URI.
 * Exits the process on failure so the server never starts in a broken state.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8+ has these defaults, but listed for clarity
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Surface Mongoose connection lifecycle events
mongoose.connection.on('disconnected', () =>
  console.warn('⚠️   MongoDB disconnected.')
);
mongoose.connection.on('reconnected', () =>
  console.info('✅  MongoDB reconnected.')
);

module.exports = connectDB;
