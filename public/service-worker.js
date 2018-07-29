importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

var CACHE_STATIC = "static-v34";
var CACHE_DYNAMIC = "dynamic-v24";
var STATIC_FILES = [
    "/",
    "/index.html",
    "/offline.html",
    "/src/js/app.js",
    "/src/js/utility.js",
    "/src/js/feed.js",
    "/src/js/idb.js",
    "/src/js/promise.js",
    "/src/js/fetch.js",
    "/src/js/material.min.js",
    "/src/css/app.css",
    "/src/css/feed.css",
    "/src/images/main-image.jpg",
    "https://fonts.googleapis.com/css?family=Roboto:400,700",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

// function trimCache(cacheName, maxLength) {
//     caches.open(cacheName)
//         .then((cache) => {
//             cache.keys()
//                 .then((keyList) => {
//                     if(keyList.length > maxLength) {
//                         cache.delete(keyList[0])
//                             .then(trimCache(cacheName, maxLength));
//                     }
//                 });
//         });   
// }

self.addEventListener("install", function(event) {
    console.log("[ServiceWorker] installing service Worker...", event);
    //wait until cache is open to us to continue with installing service worker
    event.waitUntil(
        caches.open(CACHE_STATIC)
        .then(function(cache) {
            console.log("[ServiceWorker] precaching app shell");
            cache.addAll(STATIC_FILES);
        })
    );

});

self.addEventListener("activate", function(event) {
    console.log("[ServiceWorker] activating service worker...", event);
    /* wait until the old caches are deleted, so that we get updated static files.
    Usefull if code has changed from any of the html,css or js files.
    Cache versioning...
    */
    event.waitUntil(
        caches.keys()
            .then(function(keyList) {
                var promiseArray = keyList.map(function(key) {
                    if(key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
                        console.log("[ServiceWorker] removing old cache.", key);
                        return caches.delete(key);
                    }
                });
                return Promise.all(promiseArray);
            })
    );
    return self.clients.claim();
});

// self.addEventListener("fetch", function(event) {
//     /* 
//     check the cache to see if the given request matches
//     that of anything in it. If so, then load those static files
//     */
//     event.respondWith(
//         caches.match(event.request)
//             .then(function(response) {
//                 if(response) {
//                     return response;
//                 }
//                 //if not in cache, then fetch it from server and store it in cache.
//                 console.log("Not in cache...fetching from server");
//                 return fetch(event.request)
//                     .then(function(res) {
//                         return caches.open(CACHE_DYNAMIC)
//                             .then(function(cache) {
//                                 cache.put(event.request.url, res.clone());
//                                 return res;
//                             });
//                     })
//                     .catch(function(error) {
//                         /* If this code runs, it means user is offline 
//                         and the resource wasn't in the cache.*/
//                         return caches.open(CACHE_STATIC)
//                             .then(function(cache) {
//                                 return cache.match("/offline.html");
//                             });
//                     });
//             })
//     );
// });

function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        console.log('matched ', string);
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
}

self.addEventListener("fetch", function(event) {
    var url = "https://picshare-46c7b.firebaseio.com/posts";
    if(event.request.url.indexOf(url) > -1) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    var responseToStore = response.clone(); // to store in indexedDB
                    // clear all of the old data!!
                    deleteAllDataFromObjectStore("posts")
                        .then(function() {
                            return responseToStore.json();
                        })
                        .then(function(jsonData) {
                            for(var key in jsonData) {
                                storeDataToObjectStore("posts", jsonData[key]); // store new data to IndexedDB.
                            }
                        });
                    return response;
                })
        );
    }
    else if(isInArray(event.request.url, CACHE_STATIC)) {
        event.repsondWith(
            caches.match(event.request)
        );
    }
    else {
        event.respondWith(
            caches.match(event.request)
            .then(function(response) {
                if(response) {
                    return response;
                }
                //if not in cache, then fetch it from server and store it in cache.
                console.log("Not in cache...fetching from server");
                return fetch(event.request)
                    .then(function(res) {
                        return caches.open(CACHE_DYNAMIC)
                            .then(function(cache) {
                                cache.put(event.request.url, res.clone());
                                return res;
                            });
                    })
                    .catch(function(error) {
                        /* If this code runs, it means user is offline 
                        and the resource wasn't in the cache.*/
                        return caches.open(CACHE_STATIC)
                            .then(function(cache) {
                                if(event.request.headers.get('accept').includes('text/html')) {
                                    return cache.match("/offline.html");
                                }
                            });
                    });
            })
        );
    }
    
});


// cache only
// self.addEventListener("fetch", function(event) {
//     event.respondWith(
//         caches.match(event.request)
//     );
// });

// network only
// self.addEventListener("fetch", function(event) {
//     event.respondWith(
//        fetch(event.request)
//     );
// });

// network first, on fail => cache fallback
// self.addEventListener("fetch", function(event) {
//         event.respondWith(
//             fetch(event.request)
//                 .catch(function(error) {
//                     return caches.match(event.request)
//                 })
//         );
// });

// self.addEventListener("fetch", function(event) {
//     event.respondWith(
//         fetch(event.request)
//             .then(function(response) {
//                 return caches.open(CACHE_DYNAMIC)
//                     .then(function(cache) {
//                         cache.put(event.request.url, response.clone());
//                         return response;
//                     });
//             })
//             .catch(function(error) {
//                 return caches.match(event,request);
//             })
//     );
// });

self.addEventListener("sync", function(event) {
    console.log("[service-worker.js] background syncing", event);
    if(event.tag === "syncNewPosts"){
        console.log("[service-worker.js] synNewPost sync event");
        event.waitUntil(
            getAllDataFromObjectStore("syncedPosts")
                .then(function(syncedPosts) {
                    for(var eachPost of syncedPosts){
                        var formData = new FormData();
                        formData.append("id", eachPost.id);
                        formData.append("title", eachPost.title);
                        formData.append("location", eachPost.location);
                        var pictureName = eachPost.id + ".png";
                        formData.append("file", eachPost.picture, pictureName);
                        var config = {
                            method: "POST",
                            body: formData
                        };
                        fetch("https://us-central1-picshare-46c7b.cloudfunctions.net/storePostData", config)
                            .then(function(response) {
                                console.log("Sent data ", response);
                                // if response is ok, we can delete post from IndexedDB since we stored this post in firebase db.
                                if(response.ok) {
                                    response.json().then(function(resData) {
                                        deleteItemFromObjectStore("syncedPosts", resData.id);
                                    });
                                }
                            })
                            .catch(function(error) {
                                console.error(error);
                            });
                    }
                })
        );
    }
});

/* listens for click events that happened on notifications
    this service worker created. */
self.addEventListener("notificationclick", function(event) {
    var notification = event.notification; // the notification that the click event happened on.
    var notificationAction = event.action; // the action that happened. ie "confirm" or "cancel"
    console.log(notification);
    if(notificationAction === "confirm"){
        console.log("cofirm was chosen");
        notification.close();
    }
    else {
        console.log(notificationAction);
        // match all clients where this service worker is active
        event.waitUntil(
            clients.matchAll()
                .then(function(allClients) {
                    // find a client where the browser window is open. allClients is an array
                    var activeClient = allClients.find(function(client) {
                        return client.visibilityState === "visible";
                    });
                    if (activeClient !== undefined) { // if we found a client where browser is open
                        activeClient.navigate(notification.data.url); // access url property that was setup with the notification option within push event.
                        activeClient.focus(); // focus on the window
                    }
                    else {
                        clients.openWindow(notification.data.url); // access url property that was setup with the notification option within push event.
                    }
                    notification.close();
                })
        );
        
    }

});

self.addEventListener("notificationclose", function(event) {
    console.log("Notification was closed", event);
});



// listen for push events (push notifications)
self.addEventListener("push", function(event) {
    console.log("push notification recieved", event);
    var pushNotificationData = {title: "New!", content: "Something new happened!", openUrl: "/"};
    if(event.data){ // if this push event (notification) has any data associated with it
        pushNotificationData = JSON.parse(event.data.text());
    }

    //setup some options for the notification.
    var options = {
        body: pushNotificationData.content,
        icon: "/src/images/icons/app-icon-96x96.png",
        badge: "/src/images/icons/app-icon-96x96.png",
        data: {
            url: pushNotificationData.openUrl // get the openUrl property we passed from server. We can access this within the notificationclick event
        }
    };

    event.waitUntil(
        self.registration.showNotification(pushNotificationData.title, options)
    );
});