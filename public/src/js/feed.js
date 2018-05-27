var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.getElementById("shared-moments");

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
  createPostArea.style.display = 'block';
  showInstallBannerIfPossible();
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
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
  cardTitle.style.height = "180px";
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
/* if network is slow, we use assets from cache. Once
we get data (second then()) we clear our view and create the card..
*/
if('caches' in window) {
  caches.match(url)
    .then(function(response) {
      if(response) {
        return response.json();
      }
    })
    .then(function(data) {
      console.log("From cache: ", data);
      if(!networkDataRecieved) {
        var postsArray = [];
        for(var key in data) {
          postsArray.push(data[key]);
        }
       createCardsBasedOnPosts(postsArray);
      }
    })
}