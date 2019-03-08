const mongoose = require('mongoose');

const protocol = "mongodb://";
const url = "localhost:"
const port = "27017";
const dbName = "/todoapp"
const localDB = protocol + url + port + dbName;

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || localDB, {useNewUrlParser: true});

module.exports = { mongoose };