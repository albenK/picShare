const firebaseFunctions = require('firebase-functions');
const firebaseAdmin = require("firebase-admin");
const cors = require("cors")({origin: true});
var serviceAccount = require("./picshare-fb-key.json");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://picshare-46c7b.firebaseio.com/",
});
exports.storePostData = firebaseFunctions.https.onRequest(function(request, response) {
    // wrap all requests in cors function.
    cors(request, response, function() {
        firebaseAdmin.database().ref("posts").push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        })
        .then(function() {
            response.status(201).json({message: "Data stored ", id: request.body.id});
        })
        .catch(function(error) {
            response.status(500).json({error: error});
        });
    });
});
