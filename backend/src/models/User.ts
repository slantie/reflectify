import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  photos: [
    {
      value: String,
    },
  ],
  emails: [
    {
      value: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', userSchema);
