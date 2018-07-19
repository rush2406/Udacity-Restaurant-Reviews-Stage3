navigator.serviceWorker.register('./sw.js').then(function (reg) {
    console.log('Service worker registered.');

    if (!navigator.serviceWorker.controller) {
        return;
    }

    if (reg.waiting) {
        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
    }

    if (reg.installing) {
        navigator.serviceWorker.addEventListener('statechange', function () {
            if (navigator.serviceWorker.controller.state == 'installed') {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }
        });
    }

    reg.addEventListener('updatefound', function () {
        navigator.serviceWorker.addEventListener('statechange', function () {
            if (navigator.serviceWorker.controller.state == 'installed') {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }
        });
    });

}).catch(function () {
    console.log('Service worker registration failed');
});

var refreshing;
navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
})

navigator.serviceWorker.ready.then(function (swRegistration) {    
    return swRegistration.sync.register('myFirstSync');
});

function onOnline() {
    console.log('Going online');
    DBHelper.submitOfflineReviews();
}

function onOffline() {
    console.log('Going offline');
}

window.addEventListener('online', onOnline);
window.addEventListener('offline', onOffline);