importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

var CACHE_STATIC = "static-v10";
var CACHE_DYNAMIC = "dynamic-v1";
var STATIC_FILES = [
    "/",
    "/index.html",
    "/offline.html",
    "/src/js/app.js",
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
                        var config = {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Accept": "application/json"
                            },
                            body: JSON.stringify({
                              id: eachPost.id,
                              title: eachPost.title,
                              location: eachPost.location,
                              image: "https://firebasestorage.googleapis.com/v0/b/picshare-46c7b.appspot.com/o/sf-boat.jpg?alt=media&token=1fece609-8e0d-4df4-b352-ee470d6f3b18"
                            })
                        };
                        fetch("https://picshare-46c7b.firebaseio.com/posts.json", config)
                            .then(function(response) {
                                console.log("Sent data ", response);
                                // if response is ok, we can delete post from IndexedDB since we stored this post in firebase db.
                                if(response.ok) {
                                    deleteItemFromObjectStore("syncedPosts", eachPost.id); // Isn't working correctly!!
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