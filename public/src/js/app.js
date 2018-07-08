var installBannerEvent = null; //keep a reference of the beforeinstallprompt event
var enableNotificationsButtons = document.querySelectorAll(".enable-notifications");
// if Promise's arent built into the browser, then add promise from promise.js
if(!window.Promise) {
    window.Promise = Promise;
}

if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
        .then(function(swRegistration) {
            console.log("serviceWorker registered", swRegistration);
        })
        .catch(function(error) {
            console.error("An error occured registering service worker", error);
        });
}

window.addEventListener("beforeinstallprompt", function(event) {
    console.log("prevent initial showing of install banner");
    /* we don't want to show the install banner immediately, so prevent it. 
        We'll show it for the first time, when user clicks the + button.
    */
    event.preventDefault();
    installBannerEvent = event;
    return false;
});

function showConfirmationNotification() {
    if("serviceWorker" in navigator){
        navigator.serviceWorker.ready
            .then(function(serviceWorkerRegistration) {
                var options = { 
                    body: "Nice! You've subscribed!",
                    icon: "/src/images/icons/app-icon-96x96.png",
                    image: "/src/images/sf-boat.jpg",
                    dir: "ltr",
                    lang: "en-US", // BCP 47 complient
                    vibrate: [100, 50, 200], // vibrate for 100ms, pause for 50ms, and vibrate again for 200ms
                    badge: "/src/images/icons/app-icon-96x96.png", // black and white badge that shows up on the top bar for android devices
                    tag: "confirm-notification",
                    renotify: true,
                    actions: [ // actions are buttons shown for the notification.
                        {action: "confirm", title: "Okay", icon: "/src/images/icons/app-icon-96x96.png"},
                        {action: "cancel", title: "Cancel", icon: "/src/images/icons/app-icon-96x96.png"}
                    ]
                };
                serviceWorkerRegistration.showNotification("PicShare", options);
            });
    }
}

function setupPushSubscriptionWithServiceWorker() {
    if(!("serviceWorker" in navigator)){ // if no service worker support
        return;
    }
    var serviceWorkerReg = null; // reference to the serviceWorkerRegistration, so we can use it anywhere below
    navigator.serviceWorker.ready
        .then(function(serviceWorkerRegistration) {
            serviceWorkerReg = serviceWorkerRegistration;
            return serviceWorkerRegistration.pushManager.getSubscription();
        })
        .then(function(pushSubscription) {
            if(pushSubscription === null) {
                var vapidPublicKey = "BKsfnUyaQLJCUSiMFokPs8v55vR97G2GTYuwt4vmlNQLXY_9YLncr_fmPtnZvvuqKEaq5YXESB8ey04wATfQrq4";
                var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
                // create a new subsciption
                return serviceWorkerReg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            }
            else {
                // use existing subscription.
            }
        })
        .then(function(newSubscription) {
            var config = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(newSubscription)
            };
            return fetch("https://picshare-46c7b.firebaseio.com/subscriptions.json", config);
        })
        .then(function(res) {
            if(res.ok){
                showConfirmationNotification();
            }
        })
        .catch(function(error) {
            console.error(error);
        });
}

function askForNotificationPermission(event) {
    Notification.requestPermission(function(result) {
        console.log("User choice", result);
        if(result !== "granted"){
            console.log("No notification permission");
        }
        else {
            setupPushSubscriptionWithServiceWorker();
            // TODO: hide enable notifications buttons, since user granted notifications
        }
    })
}

if("Notification" in window && "serviceWorker" in navigator) {
    for(var i = 0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = "inline-block";
        enableNotificationsButtons[i].addEventListener("click", askForNotificationPermission);
    }
}