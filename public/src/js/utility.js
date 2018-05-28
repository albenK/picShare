// This file is just a helper file for IndexedDB related things.

var indexedDbPromise = idb.open("posts-store", 1, function(database) {
    // if "posts" object store doesnt exist..
    if(!database.objectStoreNames.contains("posts")) { 
        //...then create it
        database.createObjectStore("posts", {keyPath: "id"});
    }
});

function storeDataToObjectStore(objectStoreName, jsonData) {
    return indexedDbPromise.then(function(database) {
        var transaction = database.transaction(objectStoreName, "readwrite"); // create a readwrite transaction to the store.
        var store = transaction.objectStore(objectStoreName); // access the store.
        store.put(jsonData); // put data into indexedDb object store.
        return transaction.complete;
    })
}

function getAllDataFromObjectStore(objectStoreName) {
    return indexedDbPromise.then(function(database) {
        var transaction = database.transaction(objectStoreName, "readonly"); // create a readonly transaction to the store.
        var store = transaction.objectStore(objectStoreName);  // access the store.
        return store.getAll(); // getAll() happens to be a promise. When it resolves, we get the data.
    });
}