var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');

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


function createCard() {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url('/src/images/sf-boat.jpg')";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = "San Francisco Trip";
  cardTitleTextElement.style.color = "white";
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = "in San Francisco";
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  
  componentHandler.upgradeElement(cardWrapper);
  var sharedMomentsArea = document.getElementById("shared-moments");
  sharedMomentsArea.appendChild(cardWrapper);
}

fetch("https://httpbin.org/get")
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    createCard();
  });