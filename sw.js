var CACHE_NAME = 'tinku-v1';
var urlsToCache = ['/', '/css/styles.css',
 '/css/mediaquery.css',
 '/js/dbhelper.js',
 '/js/restaurant_info.js',
   'js/sw_registration.js',
   'node_modules/idb/lib/idb.js'
   /*'/js/main.js','https://fonts.googleapis.com/css?family=Lato:300,400',
   'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js',*/];
self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
    }));
});
self.addEventListener('fetch', function(event) {
    
    event.respondWith(caches.match(event.request).then(function(response) {
        // Cache hit - return response
        if (response) {
            return response;
        }
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, responseToCache);
            });
            return response;
        });
    }));
});
self.addEventListener('activate', function(event) {
    var cacheWhitelist = ['tinku-v2'];
    event.waitUntil(caches.keys().then(function(cacheNames) {
        return Promise.all(cacheNames.map(function(cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
            }
        }));
    }));
});

self.addEventListener('message', (event) => {
    console.log(event);
    
    // var messages = JSON.parse(event.data);
    if (event.data.action === 'skipWaiting') {
       self.skipWaiting();
    }
});

self.addEventListener('sync', function (event) {
    if (event.tag == 'myFirstSync') {
        const DBOpenRequest = indexedDB.open('restaurants', 1);
        DBOpenRequest.onsuccess = function (e) {
            db = DBOpenRequest.result;
            let tx = db.transaction('offline-reviews', 'readwrite');
            let store = tx.objectStore('offline-reviews');
            // 1. Get submitted reviews while offline
            let request = store.getAll();
            request.onsuccess = function () {
                // 2. POST offline reviews to network
                for (let i = 0; i < request.result.length; i++) {
                    fetch(`http://localhost:1337/reviews/`, {
                        body: JSON.stringify(request.result[i]),
                        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                        credentials: 'same-origin', // include, same-origin, *omit
                        headers: {
                            'content-type': 'application/json'
                        },
                        method: 'POST',
                        mode: 'cors', // no-cors, cors, *same-origin
                        redirect: 'follow', // *manual, follow, error
                        referrer: 'no-referrer', // *client, no-referrer
                    })
                    .then(response => {
                        return response.json();
                    })
                    .then(data => {
                        let tx = db.transaction('all-reviews', 'readwrite');
                        let store = tx.objectStore('all-reviews');
                        let request = store.add(data);
                        request.onsuccess = function (data) {
                            //TODO: add data (= one review) to view
                            let tx = db.transaction('offline-reviews', 'readwrite');
                            let store = tx.objectStore('offline-reviews');
                            let request = store.clear();
                            request.onsuccess = function () { };
                            request.onerror = function (error) {
                                console.log('Unable to clear offline-reviews objectStore', error);
                            }
                        };
                        request.onerror = function (error) {
                            console.log('Unable to add objectStore to IDB', error);
                        }
                    })
                    .catch(error => {
                        console.log('Unable to make a POST fetch', error);
                    })
                }
            }
            request.onerror = function (e) {
                console.log(e);
            }
        }
        DBOpenRequest.onerror = function (e) {
            console.log(e);
        }
    }
});