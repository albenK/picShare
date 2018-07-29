const firebaseFunctions = require('firebase-functions');
const firebaseAdmin = require("firebase-admin");
const cors = require("cors")({origin: true});
var serviceAccount = require("./picshare-fb-key.json");
var webpush = require("web-push");
var formidable = require("formidable");
var Busboy = require("busboy");
var fs = require("fs"); // already comes with Node
var path = require("path"); // already comes with Node
var os = require("os"); // already comes with Node
var UUID = require("uuid-v4"); // package for generating unique id's

var googleCloudConfig = {
    projectId: "picshare-46c7b",
    keyFilename: "picshare-fb-key.json"
};
var googleCloudStorage = require("@google-cloud/storage")(googleCloudConfig); // this is what firebase storage uses behind the scenes.
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
        var uuid = UUID();
    
        const busboy = new Busboy({ headers: request.headers });
        // These objects will store the values (file + fields) extracted from busboy
        let upload;
        const fields = {};
    
        // This callback will be invoked for each file uploaded
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
          console.log(
            `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
          );
          const filepath = path.join(os.tmpdir(), filename);
          upload = { file: filepath, type: mimetype };
          file.pipe(fs.createWriteStream(filepath));
        });
    
        // This will be invoked on every field detected
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
          fields[fieldname] = val;
        });
    
        // This callback will be invoked after all uploaded files are saved.
        busboy.on("finish", () => {
          var firebaseBucket = googleCloudStorage.bucket("picshare-46c7b.appspot.com");
          var firebaseUploadConfig = {
            uploadType: "media",
            metadata: {
              metadata: {
                contentType: upload.type,
                firebaseStorageDownloadTokens: uuid
              }
            }
          };
          firebaseBucket.upload(upload.file, firebaseUploadConfig, function(err, uploadedFile) {
            if (!err) { // if there's no error
                firebaseAdmin.database().ref("posts").push({
                    id: fields.id,
                    title: fields.title,
                    location: fields.location,
                    rawLocation: {
                        lat: fields.rawLocationLat,
                        lng: fields.rawLocationLng
                    },
                    image: "https://firebasestorage.googleapis.com/v0/b/" +
                    firebaseBucket.name + "/o/" + encodeURIComponent(uploadedFile.name) +
                    "?alt=media&token=" + uuid
                })
                .then(function() {
                    webpush.setVapidDetails(
                      "mailto:albenk234@gmail.com",
                      "BKsfnUyaQLJCUSiMFokPs8v55vR97G2GTYuwt4vmlNQLXY_9YLncr_fmPtnZvvuqKEaq5YXESB8ey04wATfQrq4",
                      "Y8xYRdqyOBYqIMbBfrXu5vbOZa4AMyrpJOAkhg7ePzc"
                    );
                    return firebaseAdmin.database().ref("subscriptions").once("value"); // get the value once and return that!
                })
                .then(function(pushSubscriptions) {
                    // for each pushSubscription (browser/service worker), we send the push notification
                    pushSubscriptions.forEach(function(pushSubscription) {
                        var pushConfig = {
                            endpoint: pushSubscription.val().endpoint,
                            keys: {
                                auth: pushSubscription.val().keys.auth,
                                p256dh: pushSubscription.val().keys.p256dh
                            }
                        };
                        var payload = JSON.stringify({
                            title: "New Post",
                            content: "A new post has been added!",
                            openUrl: "/help"
                        });
                        webpush.sendNotification(pushConfig, payload)
                            .catch(function(err) {
                                console.log(err);
                            });
                    });
                    response.status(201).json({ message: "Data stored", id: fields.id });
                })
                .catch(function(err) {
                    response.status(500).json({ error: err });
                });
            } 
            else {
                console.log(err);
            }
        });
    });
    
        // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
        // a callback when it's finished.
        busboy.end(request.rawBody);
        // formData.parse(request, function(err, fields, files) {
        //   fs.rename(files.file.path, "/tmp/" + files.file.name);
        //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
        // });
    });
});
