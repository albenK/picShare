// This file is just a helper file for IndexedDB related things. Also includes some other helper functions

var indexedDbPromise = idb.open("posts-store", 1, function(database) {
    // if "posts" object store doesnt exist..
    if(!database.objectStoreNames.contains("posts")) { 
        //...then create it
        database.createObjectStore("posts", {keyPath: "id"});
    }
    if(!database.objectStoreNames.contains("syncedPosts")) { 
        database.createObjectStore("syncedPosts", {keyPath: "id"});
    }
});

function storeDataToObjectStore(objectStoreName, jsonData) {
    return indexedDbPromise.then(function(database) {
        var transaction = database.transaction(objectStoreName, "readwrite"); // create a readwrite transaction to the store.
        var store = transaction.objectStore(objectStoreName); // access the store.
        store.put(jsonData); // put data into indexedDb object store.
        return transaction.complete; // transaction.complete is a promise..
    })
}

function getAllDataFromObjectStore(objectStoreName) {
    return indexedDbPromise.then(function(database) {
        var transaction = database.transaction(objectStoreName, "readonly"); // create a readonly transaction to the store.
        var store = transaction.objectStore(objectStoreName);  // access the store.
        return store.getAll(); // getAll() happens to be a promise. When it resolves, we get the data.
        // no need for "return transaction.complete" because it's only used for "readwrite" operations
    });
}

// to delete all of the data from our object store.
function deleteAllDataFromObjectStore(objectStoreName) {
    return indexedDbPromise.then(function(database) {
        var transaction = database.transaction(objectStoreName, "readwrite"); // create a readwrite transaction to the store.
        var store = transaction.objectStore(objectStoreName); // access the store.
        store.clear(); // clear all data within the store.
        return transaction.complete; // transaction.complete is a promise..
    });
}

// to delete a specific item from our object store.
function deleteItemFromObjectStore(objectStoreName, idOfItem) {
    return indexedDbPromise.then(function(database) {
        var transaction = database.transaction(objectStoreName, "readwrite"); // create a readwrite transaction to the store.
        var store = transaction.objectStore(objectStoreName); // access the store.
        store.delete(idOfItem);
        return transaction.complete; // transaction.complete is a promise..
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
}
