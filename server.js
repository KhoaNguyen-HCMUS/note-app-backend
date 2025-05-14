const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
  console.log('API is running...');
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ MongoDB connected and pinged successfully');

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (error) {
      console.error('❌ Ping failed:', error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
