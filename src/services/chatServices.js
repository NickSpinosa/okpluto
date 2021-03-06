"use strict";

var socket = null;

const createSocket = function() {
  socket = io.connect('/');
  
  socket.on('connect', function(data) {
    var dbId = localStorage.getItem('mongoUserId');
    console.log('socket connected');
    console.log('emitting newAvailableUser', dbId);
    
    //send new available user event to server so it can emit to all users and they 
    //update their 'chat available' display for the user
    socket.emit('onlineUser', {sender: dbId});
  });

  socket.on('message',function(data){
    console.log('message received',data);
  });

}

const sendMessage = function(attendees,message){
  console.log('sending message in chatServices',message);
  socket.emit('message',{
    sender: attendees[0],
    receiver: attendees[1],
    message: message,
  });
}
const requestChat = function(attendees){
  console.log('requesting chat');
  socket.emit('requestChat',{
    sender: attendees[0],
    receiver: attendees[1],
  });
}

//the following are listeners registered from components which change their props
//in a callback registered here to trigger on socket events

//this sends messages to chat dialog component
const listenForMessage = function(callback){
  socket.on('message', function(data){
    callback(JSON.parse(data));
  });
}

//this sends user ids to the card components that display if users are online
const listenForOnlineUser = function(callback){
  socket.on('onlineUsers', function(data){
    data = JSON.parse(data);
    console.log('new available users from socket', data);
    data.forEach(function(user){
      callback(user);
    });
  });
}

const listenForOfflineUser = function(callback){
  socket.on('offlineUser', function(data){
    data = JSON.parse(data);
    callback(data);
  });
}

//
const listenForNewChat = function(callback){
  socket.on('requestChat', function(data){
    console.log('chat requested from:',data);
    callback(data);
  });
}

const disconnectSocket = function(){
  socket.disconnect();
}

module.exports = {
  createSocket: createSocket,
  listenForNewChat: listenForNewChat,
  listenForOnlineUser: listenForOnlineUser,
  listenForMessage: listenForMessage,
  sendMessage: sendMessage,
  requestChat: requestChat,
  disconnectSocket: disconnectSocket,
  listenForOfflineUser: listenForOfflineUser,
}