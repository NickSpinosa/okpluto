'use strict';
//change
var User = require('../models/users');
var Event = require('../models/events');
// import dependencies
var request = require('request');
// import API keys
var authPath = process.env.auth0 || require('../../config/auth0');
var api = process.env.api || require('../../config/api.js');
var Promise = require('bluebird');
const db = require('../../config/db');
const ObjectId = require('mongoose').Types.ObjectId;
//const generateBreedRecomendations = require('../../matching_util.js');
const breedObj = require('../../breeds.js');
const googleMaps = require('@google/maps').createClient({
	key: api.API_KEY
});
module.exports = function(app) {

	app.get("/api/shareKeys", (req, res) => {
		res.status(200).send(authPath);
	});

	//======Location End Points=======//

	//Find Latitude and Longitude of an address / location
	app.get('/api/geocode', (req, res) => {
    var getCoordinates = function(address) {
    	return new Promise(function(resolve, reject) {
    		googleMaps.geocode({ address: address }, function(err, res) {
    			if (err) reject(err);
    			resolve(res.json.results[0].geometry.location);
    		});
    	});
    };

    getCoordinates(req.query.loc)
      .then(function(results) {
      	res.status(200).send(results);
      });
	});

	//Find distance btwn coordinates
	app.post('/api/distance', (req, res) => {
		console.log('hitting /api/distance');
		var getDistance = function(originCoor, destCoors) {
			return new Promise((resolve, reject) => {
				googleMaps.distanceMatrix({
					origins: originCoor,
					destinations: destCoors
				}, (err, res) => {
					if (err) reject(err);
					resolve(res)
				})
			})
		}

		getDistance(JSON.parse(req.body.origin), JSON.parse(req.body.destinations))
		.then(results => {
			res.status(200).send(results.json.rows[0].elements)
		})
	})

	//======User End Points=======//

	app.get('/query/dbId', (req, res) => {
		console.log('hitting query/dbId');
		User.findById(req.query.dbId)
		.exec((err, user) => {
			if (err) console.log(err);
			console.log('sending user for query/dbId', req.query.dbId);
			res.status(201).send(user)
		});
	});
  // GET request to return all users from db
	app.get('/api/users', (req, res) => {
		console.log('hitting api/users');
		User.find()
		.exec((err, users) => {
			if (err) {
				console.log(err);
				res.status(404).send('Database error, no users found')
			}
			console.log('sending back user');
			res.status(201).send({users: users});
		});
	});

	app.post('/signin', (req, res) => {
		console.log('hitting /signin');
		//Auth0 user ID
		var id = req.body.id;

		//POST path to retrieve user info from Auth0
		var url = 'https://' + authPath.AUTH0_DOMAIN + '/tokeninfo';

		request.post(url, { json: {id_token: id} } , (err, response) => {
			if (err) console.log(err)

			const userId = response.body.user_id;

			//updates blackListBreeds array on user record
			if(response.body.identities[0].provider === 'facebook'){
				generateBreedRecomendations(userId, breedObj);
			}

			//Look for user in mongoDB;
			User.findOne({
				'id': response.body.user_id
			}).exec((err, user) => {
				//Add user if they don't exist
				if (!user) {
					console.log('no user found');
					//get user info supplied through login / signup from FB, Google and Auth0
					var userData = response.body;
					//For signups through Auth0 collect metadata
					if (userData.user_metadata) {
						for (var key in userData.user_metadata) {
							userData[key] = userData.user_metadata[key];
						}
					}
					if (userData.picture_large) {
						userData.picture = userData.picture_large;
					}
					//Create user in mongoDB
					new User ({
						id: userData.user_id,
						firstname: userData.given_name,
						lastname: userData.family_name,
						profilepic: userData.picture,
						username: 'anonymous' + Math.floor(Math.random()*100000000)
					}).save((err, user) => {
						if (err) console.log(err);
						res.status(200).send({user: user, creation: true});
					});

					//updates blackListBreeds array on user record
					if(response.body.identities[0].provider === 'facebook'){
						generateBreedRecomendations(userId, breedObj);
					}

				} else {
					console.log('sending user');
					user.creation = false;
					res.status(200).send({user: user, creation: false});
				}
			})
		})
	});
  // update users by finding their id from the db
	app.put('/api/users', (req, res) => {
		User.findById(req.body.dbId, (err, user) => {
			for (var key in req.body) {
				if (key !== 'dbId') {
					user[key] = req.body[key];
				}
			}
			user.save((err, updatedUser) => {
				res.status(200).send(updatedUser);
			})
		})
	});
  // delete users from the db by their id
	app.delete('/api/users', (req, res) => {
		User.findByIdAndRemove(req.body.dbId)
		.exec((user) => {
			res.status(200).send(userRemoved);
		})
	});

	//======Like / Unlike Endpoints=======//
	app.put('/api/users/like', (req, res) => {
		db.collections.users.updateOne({_id: new ObjectId(req.body.userId)}, { $push: {dogLikes: new ObjectId(req.body.friendId)}}, err => {
			if (err) console.log('error adding like to db', err);
			else res.status(202).send(req.body.friendId);
		});
	});

	app.delete('/api/users/like', (req, res) => {
		db.collections.users.updateOne({_id: new ObjectId(req.body.userId)}, { $pullAll: {dogLikes: [new ObjectId(req.body.friendId)]}}, err => {
			if (err) console.log('error removing like to db', err);
			else res.status(202).send(req.body.friendId);
		});
	});

	//======Event End Points=======//
	app.get('/api/events', (req, res) => {
		Event.find()
		.exec((err, events) => {
			if (err) {
				console.log(err);
				res.status(404).send('Database error, no events found');
			}
			res.status(201).send({events: events});
		});
	});
//change
	app.get('/queryEvents/dbId', (req, res) => {
		Event.find({attendees: req.query.dbId})
		.exec((err, attendingEvents) => {
			Event.find({creator: req.query.dbId})
			.exec((err, createdEvents) => {
				if (err) {
				console.log(err);
				res.status(404).send('Database error, no events found');
			} else {
				res.status(201).send({attendingEvents: attendingEvents, createdEvents, createdEvents});
			}
			})
		})
	})
  // post a new event
	app.post('/api/events', (req, res) => {
		req.body = JSON.parse(req.body.data);
		new Event ({
			creator: req.body.creator,
			eventname: req.body.eventname,
			category: req.body.category,
			loc: req.body.loc,
			lat: req.body.lat,
			lng: req.body.lng,
			date: req.body.date,
			time: req.body.time,
			attendees: req.body.attendees
		}).save((err, event) => {
			if (err) throw err
			res.status(200).send({event: event});
		});
	})

	app.put('/api/events/add', (req, res) => {
		Event.findById(req.body.eventId, (err, event) => {
			let attendees = event.attendees;
			if (attendees.indexOf(req.body.userId) === -1) {
				attendees.push(req.body.userId);
			}
			event.attendees = attendees;
			event.save((err, updatedEvent) => {
				res.status(200).send({updatedEvent: updatedEvent})
			});
		});
	});

	app.put('/api/events/remove', (req, res) => {
		Event.findById(req.body.eventId, (err, event) => {
			let attendees = event.attendees;
			let index = -1;
			for (var i = 0; i < attendees.length; i++) {
				if (attendees[i] === req.body.userId) {
					index = i;
					break;
				}
			}
			event.attendees.splice(index, 1)
			event.save((err, updatedEvent) => {
				res.status(200).send({updatedEvent: updatedEvent});
			});
		});
	});

	app.delete('/api/events', (req, res) => {
		Event.findByIdAndRemove(req.body.eventId, (err, event) => {
			res.status(201).send({removedEvent: event});
		});
	});
};