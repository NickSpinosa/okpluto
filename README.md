# Ok Pluto

> Social site for dogs and their owners

## Team

  - __Product Owner__: Aaron Stevens
  - __Scrum Master__: Nicholas Spinosa
  - __Development Team Members__: Justin Roche, Andrew Cernek

## Table of Contents

1. [Back-End](#Back-End)
1. [Front-End](#Front-End)
1. [Development](#development)
    1. [Installing Dependencies](#installing-dependencies)
    1. [Tasks](#tasks)
1. [Team](#team)
1. [Feature To Do List](#Feature-To-Do-List)

## Back-End

The back-end uses Node with Express, and MongoDB with Mongoose. The Gruntfile controls compiling the src directory into bundle.js

```sh
server.js
app
|---routes 
    |   routes.js - contains all API endpoints to access database, and outside APIs
|---models - Holds all DB schemas
    |   events.js
    |   users.js
config
    |   db.js - sets up connection to mongo DB
    |   api.js - hold Google API key (you will need to add this with your own key) - most Google API communication is through script tag in index.html
    |   auth0.js - auth0 API client ID and domain (you will need to add this with your own info) - utilized on front end
```

## Front-End

The front-end uses React with Material-UI, and Auth0 for password storing / login services

```sh
public
|   index.html
|   bundle.js - compiled by grunt build from /src directory
|---assets - contains images
|---css
    |   main.css
|---src - all of these files compile into bundle.js
    |   app.jsx - renders react components to DOM
    |---components - contains all react components
    |---services
        |   distanceServices.jsx - helper function, finds distance between user and other users or meetups
        |   eventServices.jsx - helper functions to communicate with DB
        |   userServices.jsx - helper functions to communicate with DB
    |---theme
        |   theme.js - material UI color theme
    |---utils
        |   AuthService.jsx - all helper functions related to Auth0
        |   google.js - not used, you can ignore
```

## Development
### Installing Dependencies

From within the root directory:

```sh
npm install
```

### Tasks

```sh
grunt
```

Will open a DB connection, and compile and run the program. Can run grunt build to just compile. If you have a watch running and it errors out, you may need to run `killall node` before restarting

### Feature To Do List

* Add photo uploading
* Lessen API calls to Google Distance Matrix
* Add messaging between users and comments on events
* Display more info events displays (map to location, or accurate address)

