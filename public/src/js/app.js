var installBannerEvent = null; //keep a reference of the beforeinstallprompt event
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