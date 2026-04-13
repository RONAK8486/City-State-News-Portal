const mongoose = require('mongoose');

// Need to import the schema properly
const emailLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toEmail: String,
  subject: String,
  status: String,
  errorDetails: String
});

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

mongoose.connect('mongodb://127.0.0.1:27017/newsapp')
  .then(async () => {
    const logs = await EmailLog.find({ status: 'failed' }).sort({ _id: -1 }).limit(1);
    console.log("LAST ERROR:", logs[0]?.errorDetails);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
