const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const admins = await Admin.find({});
    console.log("Found admins:", admins.map(a => a.email));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
