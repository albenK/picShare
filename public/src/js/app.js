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
    var options = { body: "Nice! You've subscribed!"};
    new Notification("PicShare", options);
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