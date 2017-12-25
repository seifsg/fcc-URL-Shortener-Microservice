const mongoose = require('mongoose');
const autoIncrement = require("mongodb-autoincrement");

autoIncrement.setDefaults({
    step: 1
});

// Schema
const urlSchema = mongoose.Schema({
	url: String,
	_id: Number
});
// Forcing Ids to auto increment 
urlSchema.plugin(autoIncrement.mongoosePlugin);

// Model
const urlModel = mongoose.model('url',urlSchema);

module.exports = {
	urlModel
};