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

function askForNotificationPermission(event) {
    Notification.requestPermission(function(result) {
        console.log("User choice", result);
        if(result !== "granted"){
            console.log("No notification permission");
        }
        else {
            showConfirmationNotification(); // inform user that they've subscribed
            // TODO: hide enable notifications buttons, since user granted notifications
        }
    })
}

if("Notification" in window) {
    for(var i = 0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = "inline-block";
        enableNotificationsButtons[i].addEventListener("click", askForNotificationPermission);
    }
}