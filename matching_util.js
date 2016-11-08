'use strict';


const authPath = process.env.auth0 || require('./config/auth0');
const request = require('request');
const User = require('./app/models/users');
const watson = require('watson-developer-cloud/personality-insights/v3');
let watsonInfo = process.env.watson ?  JSON.parse(process.env.watson) : require("./config/api").WATSON;
const personality_insights = new watson(watsonInfo);


//handles the Auth0 flow for getting an external api access key (in this case Facebook)
const getUserAccessKeys = function(userId) {
    let oAuthUrl = `https://${authPath.AUTH0_DOMAIN}/oauth/token`;

    return new Promise((resolve, reject) => {
        request({
            method: 'POST',
            url: oAuthUrl,
            headers: { 'content-type': 'application/json' },
            body: `{
                "client_id":"${authPath.AUTH0_CLIENT_ID}",
                "client_secret":"${authPath.AUTH0_CLIENT_SECRET}",
                "audience":"https://${authPath.AUTH0_DOMAIN}/api/v2/",
                "grant_type":"client_credentials"
            }`
        },(error,response,body) => {
            if(error) {
                console.log("oAuth error", error);
                reject(error);
            }

            let accessToken = JSON.parse(body).access_token;
            request({
                method: 'GET',
                url:`https://${authPath.AUTH0_DOMAIN}/api/v2/users/${userId}`,
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                }
            }, (err, response) => {
                if(err){
                    console.log("error", err);
                    reject(err);
                }

                let fbAccessKey = JSON.parse(response.body).identities[0].access_token;
                resolve(JSON.parse(response.body).identities);
            });
        });
    });
};

//recursively calls the facebook api to get all of the User's posts
const getFaceBookPosts = function(fbAccessKey) {
    let posts = '';
    let url = `https://graph.facebook.com/v2.8/me/posts?access_token=${fbAccessKey}`;
    let page = 1;

    function recursivePostFinder(url, cb) {
        request.get(url, (err, responseObject) => {
            if(err){
                console.log("error in recursive get", err);
            }
            responseObject = JSON.parse(responseObject.body);

            if(responseObject.data.length === 0) {
                cb(posts);

            } else {
                responseObject.data.forEach((postObject) => {
                    if(postObject.message){
                        posts = posts + " " + postObject.message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
                    }
                });

                console.log(`added posts from page ${page}`);
                page++;

                recursivePostFinder(responseObject.paging.next, cb);
            }
        })
    };

    return new Promise((resolve, reject) => {
        recursivePostFinder(url,posts => resolve(posts));
    });
};

//analyzes the user's posts with the Watson api
const watsonAnalyze = function (posts) {
    const params = {
        text: posts,
        consumption_preferences: false,
        raw_scores: false,
        headers: {
            'accept-language': 'en',
            'accept': 'application/json'
        }
    };

    return new Promise ((resolve, reject) => {
        personality_insights.profile(params, (error, response) => {
            if (error) {
                console.log('ERROR: ', error);
                reject(error);
            } else {
                console.log(JSON.stringify(response, null, 2));
                resolve(response);
            }
        });
    });
};

//determines is the User is a good match for a specific breed trait
const breedPersonalityMatch = function(breedTrait, watsonData){
    let userTrait = watsonData.personality.filter(traitObj => {
        return traitObj.name.toLowerCase() === breedTrait;
    })[0];

    if (userTrait) {
        return userTrait.percentile > 0.7;
    } else {
        return false;
    }
    
};

//determines breed recomendations for a user and adds a breed black list array to the User Record
const puppyMatcher = function(userId, watsonData, breedObj){
    let breedArray = [];

    for(let key in breedObj){
        let breed = breedObj[key];
        let matchedTraits = 0;

        breed.traits.forEach(breedTrait => {
            if(breedPersonalityMatch(breedTrait, watsonData)){
                matchedTraits++;
            }
        });

        if(matchedTraits / breed.traits.length < 0.5){
            breedArray = breedArray.concat(breed.names);
        } 
    }


   return new Promise((resolve, reject) => {
        User.findOne({'id': userId})
            .exec((err, user) => {
                if(err) reject(err);

                user.addBlackListBreeds(breedArray)
                .then(resolve);
            });
   }); 
   
};

//composes all of the above functions
const addBlackListBreeds = function(userId, breedObj){
    getUserAccessKeys(userId)
        .then((identities) => getFaceBookPosts(identities[0].access_token))
        .then(watsonAnalyze)
        .then(watsonData => puppyMatcher(userId, watsonData, breedObj))
        .then(savedUserObj => console.log("saved", savedUserObj));
};


module.exports = addBlackListBreeds; 