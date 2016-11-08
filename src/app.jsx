"use strict";

//Controls React Routes, sets up auth0 service

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import AuthService from './utils/AuthService.jsx';
import $ from 'jquery';
import Home from './components/home.jsx';
//import auth0 from '../config/auth0.js';
import UsersPage from './components/usersPage.jsx'
import Container from './components/container.jsx'
import Profile from './components/profile.jsx'
import Events from './components/events.jsx'
import ProfileCreation from './components/profileCreation.jsx'
import Loading from './components/loading.jsx'
import injectTapEventPlugin from 'react-tap-event-plugin';
import InfoDrawer from './components/infoDrawer.jsx';
import { getInfo } from './utils/communication.js';

// Setting up auth service


// const auth = new AuthService(auth0.AUTH0_CLIENT_ID, auth0.AUTH0_DOMAIN);


// // check for authenication in all protected routes
// const requireAuth = (nextState, replace) => {
//   if (!auth.loggedIn()) {
//     replace ({ pathname: '/'})
//   }
// }

getInfo().then(authPath => {
  // Setting up auth service
  console.log("auth", authPath);
  //console.log("parsed auth", JSON.parse(authPath));

  let parsedAuthPath;

  if(typeof authPath === 'string') {
    parsedAuthPath = JSON.parse(authPath);
  } else {
    parsedAuthPath = authPath;
  }

  const auth = new AuthService(parsedAuthPath.AUTH0_CLIENT_ID, parsedAuthPath.AUTH0_DOMAIN);
  // check for authenication in all protected routes
  const requireAuth = (nextState, replace) => {
    if (!auth.loggedIn()) {
      replace ({ pathname: '/'})
    }
  }


// Allows onTouchTap to work in material ui components
injectTapEventPlugin();

// Container is a parent route that passes authenication service to all
// of its children
// Info drawer is a parent route that loads in the current users info,
// and passes it as props to all direct child routes
// "access_token" route is so auth0 login has a route that matches it
// otherwise login will fail
ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={Container} auth={auth}>
      <IndexRoute component={Home} />
      <Route component={InfoDrawer} >
        <Route path="/users" component={UsersPage} onEnter={requireAuth} />
        <Route path="/events" component={Events} onEnter={requireAuth} creation={false}/>
        <Route path="/profile" component={Profile} onEnter={requireAuth} creation={false}/>
      </Route>
      <Route path="/creation" component={ProfileCreation} onEnter={requireAuth} creation={true}/>
      <Route path="access_token=:token" component={Loading} />
    </Route>
  </Router>, $('#app')[0]
);
});
