var CACHE_STATIC = "static-v14";
var CACHE_DYNAMIC = "dynamic-v7";
var STATIC_FILES = [
    "/",
    "/index.html",
    "/offline.html",
    "/src/js/app.js",
    "/src/js/feed.js",
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


self.addEventListener("fetch", function(event) {
    var url = "https://httpbin.org/get";
    if(event.request.url.indexOf(url) > -1) {
        event.respondWith(
            caches.open(CACHE_DYNAMIC)
                .then(function(cache) {
                    return fetch(event.request)
                        .then(function(response) {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                })
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
                                if(event.request.url.indexOf("/help") > -1) {
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