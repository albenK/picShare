var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.getElementById("shared-moments");
var createPostForm = document.querySelector("form");
var titleInput = document.querySelector("#title"); // form title input element
var locationInput = document.querySelector("#location"); // form location input element

// currently not being used. Allows us to cache things on demand.
function showInstallBannerIfPossible() {
  console.log("installBannerEvent is", installBannerEvent);
  if(installBannerEvent) {
    installBannerEvent.prompt();
    installBannerEvent.userChoice.then(function(choice) {
      console.log(choice.outcome);
      if(choice.outcome === "dismissed") {
        console.log("User cancelled installation :(");
      }
      else {
        console.log("User installed app!! :)");
      }
    });
    installBannerEvent = null; // reset to null, since browsers wont use it again.
  }
}

function openCreatePostModal() {
  //createPostArea.style.display = 'block';
  createPostArea.style.transform = 'translateY(0)'; 
  showInstallBannerIfPossible();
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  //createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function onSaveButtonClicked(event) {
  console.log("clicked");
  // check if the caches api is supported in the browser. If so, add the resources
  if('caches' in window) {
    caches.open("userRequested")
    .then(function(cache) {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
  
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(post) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + post.image + ")";
  cardTitle.style.backgroundSize = "cover";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = post.title;
  cardTitleTextElement.style.color = "white";
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener("click", onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function createCardsBasedOnPosts(posts) {
  clearCards();
  for(var i = 0; i < posts.length; i++){
    createCard(posts[i]);
  }
}

var url = "https://picshare-46c7b.firebaseio.com/posts.json";
var networkDataRecieved = false;
fetch(url)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    networkDataRecieved = true;
    console.log("From web: ", data);
    var postsArray = [];
    for(var key in data) {
      postsArray.push(data[key]);
    }
    createCardsBasedOnPosts(postsArray);
  });
/* if network is slow, we use assets from indexedDB.*/
if('indexedDB' in window) {
  // get all data from the "posts" object store within indexedDB.
  getAllDataFromObjectStore("posts")
    .then(function(posts) {
      if(!networkDataRecieved){
        console.log("From indexedDB:", posts);
        createCardsBasedOnPosts(posts);
      }
    });
}

function sendDataToBackend() {
  var config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: "https://firebasestorage.googleapis.com/v0/b/picshare-46c7b.appspot.com/o/sf-boat.jpg?alt=media&token=1fece609-8e0d-4df4-b352-ee470d6f3b18"
    })
  };
  fetch("https://us-central1-picshare-46c7b.cloudfunctions.net/storePostData", config)
    .then(function(response) {
      console.log("Sent data ", response);
      createCardsBasedOnPosts(); // update view.
    });
}

createPostForm.addEventListener("submit", function(event) {
  event.preventDefault();
  if(titleInput.value.trim() === "" || locationInput.value.trim() === ""){
    alert("Please enter valid data!");
    return;
  }

  closeCreatePostModal();
  if("serviceWorker" in navigator && "SyncManager" in window){
    // when service worker is ready, create  a synchronization task with it.
    navigator.serviceWorker.ready
      .then(function(serviceWorkerRegistration) {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        };
        // store data to IndexedDB, then register sync task.
        storeDataToObjectStore("syncedPosts", post)
          .then(function() {
            return serviceWorkerRegistration.sync.register("syncNewPosts");
          })
          .then(function() {
            // show snackbar to alert user.
            var snackbarContainer = document.querySelector("#confirmation-toast");
            var data = {message: "Your post was saved for syncing!"};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(error) {
            console.error(error);
          });
      });
  } else {
    sendDataToBackend();
  }
});