const util = require('util');
const dns = require('dns');
const mongoose = require('mongoose');
const urlModel = require('./urlModel').urlModel;
const dbUrl = require('./config/db');
mongoose.Promise = global.Promise;


function connectDb() {
	mongoose.connect(dbUrl.url, {
		useMongoClient: true
	});
	return mongoose.connection;
}

// shortening an url
function dnsLookup(url) {
	return new Promise(resolve => {
		dns.lookup(url, {}, (err, addr) => {
			resolve(err);
		});
	});
}

async function isValid(body) {
	if (body == undefined || body == null) {
		return false;
	}
	if (body.url == undefined) {
		return false;
	}
	if (body.url.trim() === '') {
		return false;
	}
	// dns lookup test
	// promise returns error object
	// if error object is null
	// then url is valid
	return await dnsLookup(body.url) != null;

}

function addUrlToDb(url) {
	console.log('adding to db');
	return new Promise(resolve => {
		console.log('we are in');
		//console.log(db);

		// we connect here
		const db = connectDb();
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function () {
			console.log('we are in!');

			console.log('check if it is already in the db');
			fetchUrl(url).then(existing => {
				if (!existing) {
					console.log('adding new url');
					newShortend = new urlModel({
						url: url,
						_id: 0
					});
					console.log('before saving');
					newShortend.save(function (err, newShortend) {
						console.log('after saving');
						if (err) {
							console.log(err);
							resolve(err);
						} else {
							resolve(newShortend);
						}
					});
				} else {
					console.log('returning existing');
					resolve(existing);
				}
			});
		});
	});
}

function shortUrl(app, req, res) {
	isValid(req.body).then(v => {
		console.log('testing the post');
		// do work
		if (!v) {
			console.log('test failed. error.');
			res.json({
				"error": "invalid URL"
			});
		} else {
			console.log('test passed');
			addUrlToDb(req.body.url).then(v => {
				console.log('result ', v);
				res.json({
					'original_url': v.url,
					'short_url': v._id
				});
			});
		}
	});
}

// Fetching a shortened url
function isValidId(params) {
	if (params == undefined) {
		return false;
	}
	if (params.id == undefined) {
		return false;
	}
	if (params.id.match(/^[0-9]$/g) == null) {
		return false;
	}
	return true;
}

function fetchUrl(url) {
	console.log('fetching now');
	return new Promise(resolve => {
		console.log('we are in');

		// we connect here
		const db = connectDb();
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function () {
			console.log('we are in!');
			urlModel.findOne({
				url: url
			}, function (err, _url) {
				if (err) {
					resolve(null);
				} else {
					resolve(_url);
				}
			});
		});
	});
}

function fetchUrlById(id) {
	console.log('fetching now');
	return new Promise(resolve => {
		console.log('we are in');

		// we connect here
		const db = connectDb();
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function () {
			console.log('we are in!');
			urlModel.findOne({
				_id: id
			}, function (err, url) {
				if (err) {
					resolve(null);
				} else {
					resolve(url);
				}
			});
		});
	});
}

module.exports = function (app) {
	// shortening an url
	app.post('/api/shorturl/new', (req, res) => {
		console.log('got the post');
		shortUrl(app, req, res);
	});

	// using a shortened url
	app.get('/api/shorturl/:id', (req, res) => {
		console.log('looking for url');
		console.log(req.params);
		if (isValidId(req.params)) {
			fetchUrlById(req.params.id).then(v => {
				if (!v) {
					res.json({
						"error": "No short url found for given input"
					});
				} else {
					res.redirect(v.url);
				}
			});
		} else {
			res.json({
				"error": "No short url found for given input"
			});
		}
	});
};