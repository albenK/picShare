const firebaseFunctions = require('firebase-functions');
const firebaseAdmin = require("firebase-admin");
const cors = require("cors")({origin: true});
var serviceAccount = require("./picshare-fb-key.json");
var webPush = require("web-push");
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
            /* Setup the vapid details before sending a push notification!!*/
            webPush.setVapidDetails("mailto:albenk234@gmail.com", "BKsfnUyaQLJCUSiMFokPs8v55vR97G2GTYuwt4vmlNQLXY_9YLncr_fmPtnZvvuqKEaq5YXESB8ey04wATfQrq4", "Y8xYRdqyOBYqIMbBfrXu5vbOZa4AMyrpJOAkhg7ePzc");
            return firebaseAdmin.database().ref("subscriptions").once("value"); // get the value once and return that!
        })
        .then(function(pushSubscriptions) {
            // for each pushSubscription (browser/service worker), we send the push notification
            pushSubscriptions.forEach(function(subscription) {
                var pushConfig = {
                    endpoint: subscription.val().endpoint,
                    keys: {
                        auth: subscription.val().keys.auth,
                        p256dh: subscription.val().keys.p256dh
                    }
                };
                var payload = JSON.stringify({
                    title:"New Post",
                    content: "A new post has been added!",
                    openUrl: "/help"
                });
                webPush.sendNotification(pushConfig, payload)
                    .catch(function(error) {console.log(error)});
            });
            response.status(201).json({message: "Data stored ", id: request.body.id});
        })
        .catch(function(error) {
            response.status(500).json({error: error});
        });
    });
});
