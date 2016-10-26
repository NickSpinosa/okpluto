"use strict";

var mongoose = require('mongoose');

var eventSchema = mongoose.Schema({
  creator: String,
  category: String,
  loc: String,
  lat: Number,
  lng: Number,
  date: Date,
  time: String,
  attendees: [String]
});

var Event = mongoose.model('Event', eventSchema);

module.exports = Event;