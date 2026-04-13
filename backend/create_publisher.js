const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB');
  const existingPublisher = await User.findOne({ email: 'publisher@admin.com' });
  if (!existingPublisher) {
    const publisher = new User({
      name: 'Publisher Account',
      email: 'publisher@admin.com',
      password: 'password123',
      role: 'publisher'
    });
    await publisher.save();
    console.log('Publisher account created successfully. Email: publisher@admin.com, Password: password123');
  } else {
    console.log('Publisher account already exists: publisher@admin.com / password123');
  }
  mongoose.connection.close();
}).catch(err => {
  console.error(err);
  mongoose.connection.close();
});
