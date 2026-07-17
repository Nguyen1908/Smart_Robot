var queryParams = new URLSearchParams(window.location.search);
var src = queryParams.get('src');
var width = queryParams.get('width');
var height = queryParams.get('height');
var flashvars = queryParams.get('flashvars');
var baseUrl = queryParams.get('baseUrl');
var contextUrl = queryParams.get('contextUrl');
var contextOrigin;
try {
    contextOrigin = new URL(contextUrl).origin;
} catch(e) {}
//console.info('Source:', src);

var srcData = '';

var playerElem;

var showPlaybackError = () => {
    playerElem.src = '/external/error.html';
}

// Fetch SWF itself
var fetchSource = () => {
    chrome.runtime.sendMessage({
      action: "fetchSourceFromBackground",
      src: src
    }, (response) => {
      if (response?.error) {
        if (response.error == "NotFoundError") {
          playerElem.src = '/external/error-not-found.html';
        } else if (response.error == "CorsError" || response.error == "NotAvailableError") {
          playerElem.src = '/external/error-not-found.html?error=not-available';
        } else {
          showPlaybackError();
        }
      }
      if (response?.srcData) {
        srcData = response.srcData;
        loadSource();
      }
    });
}

var trackActivation = (src, contextUrl) => {
  chrome.runtime.sendMessage({
    action: "trackActivation",
    src: src,
    contextUrl: contextUrl
  });
}

var trackSuccessfulActivation = (src, contextUrl) => {
  chrome.runtime.sendMessage({
    action: "trackSuccessfulActivation",
    src: src,
    contextUrl: contextUrl
  });
}

var loadSource = () => {
    if (srcData != '') {
        playerElem.contentWindow.postMessage({action: "loadPlayer", src: srcData, width: width, height: height, flashvars: flashvars || src, originalSrcUrl: src, baseUrl: baseUrl}, '*');
        trackActivation(src, contextUrl);
        setTimeout(() => {
            // Assume successful activation after 60s
            trackSuccessfulActivation(src, contextUrl);
        }, 60 * 1000);
    } else {
        setTimeout(loadSource, 100);
    }
}

// Fetch data requested by the SWF
var fetchData = (fetchUrl, fetchId) => {
  chrome.runtime.sendMessage({
      action: "fetchDataFromBackground",
      fetchUrl: fetchUrl,
      baseUrl: baseUrl
    }, (response) => {
      if (response?.srcData) {
        // Send requested data to player frame
        playerElem.contentWindow.postMessage({action: "fetchDataResponse", fetchId: fetchId, fetchResponse: response.srcData}, '*');
      }
    });
}

var checkIfAllowed = (callback, requestedAction) => {
  chrome.runtime.sendMessage({
      action: "checkIfAllowed",
      requestedAction: requestedAction
  }, (response) => {
      if (response.isAllowed === true) {
          callback();
      } else {
          showUpgradeMessage(requestedAction);
      }
  });
}

var showUpgradeMessage = (requestedAction) => {
    playerElem.src = '/external/upgrade.html';
    
    chrome.runtime.sendMessage({
      action: "trackUpgradeMessageShown"
    });
}

window.addEventListener('message', (msg) => {
    
    // We don't have any good validation options for messages from embedder page, so we must limit actions allowed.
    // We check if contextOrigin is our origin, but this can be spoofed, so not a great check.
    if (msg.isTrusted && msg.source == window.parent && (contextOrigin == 'https://modernkit.one' /* || contextOrigin == 'http://127.0.0.1' */)
        && msg.data.action == 'updateInternalPlayerDimensions' && msg.data.width && msg.data.height) {
        // This message is from background and intended for player.html
        playerElem.contentWindow.postMessage({action: "updateInternalPlayerDimensions", width: msg.data.width, height: msg.data.height}, '*');
        return;
    }
    
    //console.info('Message from player.html:', msg);
    //console.info('player-embed.js:', msg.source === playerElem.contentWindow);
    if (!msg.isTrusted || msg.source !== playerElem.contentWindow) {
        console.error('Untrusted message received.');
        return;
    }
    
    if (!msg.data) {
        console.error('Message missing data.');
        return;
    }
    
    if (msg.data.action == 'playbackRequested') {
        checkIfAllowed(fetchSource, msg.data.action);
    } else if (msg.data.action == 'fetchData') {
        fetchData(msg.data.fetchUrl, msg.data.fetchId);
    } else if (msg.data.action == 'showPlaybackError') {
        showPlaybackError();
    } else if (msg.data.action == 'showCompatInfo') {
        // Open new tab with more info on compat. Needed because popups within player.html do not escape sandbox.
        chrome.runtime.sendMessage({
            action: "openNewTab",
            url: "https://modernkit.one/flash-emulator/compatibility/?utm_source=extension-compatnotice&utm_medium=extension&utm_content=ext-compatnotice-text"
        });
    } else if (msg.data.action == 'openOptions') {
        // Open new tab. Needed because popups within player.html do not escape sandbox.
        chrome.runtime.sendMessage({
            action: "openNewTab",
            url: "https://modernkit.one/flash-emulator/options/?extid="+chrome.runtime.id+"&contextOrigin="+encodeURIComponent(btoa(contextOrigin))+"&utm_source=extension-options&utm_medium=extension&utm_content=ext-options-btn"
        });
    } else if (msg.data.action == 'updatePlayerDimensions' && msg.data.width && msg.data.height) {
        chrome.runtime.sendMessage({
            action: "updatePlayerDimensions",
            width: msg.data.width,
            height: msg.data.height
        });
    }
});

var autoplayOrigins = [];

/*** player-bg-common ***/
var getBooleanFeature = (baseKey, callback, defaultValue) => {
    var storageKey = 'mk1-feature-'+baseKey;
    var callbackKey = baseKey+'Allowed';
    chrome.storage.local.get(storageKey, (response) => {
        return callback({
            [callbackKey]: parseBooleanFeature(response, baseKey, defaultValue)
        });
    });
}

var parseBooleanFeature = (response, baseKey, defaultValue) => {
    var storageKey = 'mk1-feature-'+baseKey;
    var callbackKey = baseKey+'Allowed';
    // Downstream expects boolean, so only return boolean
    if (response[storageKey] && typeof response[storageKey] == 'boolean') {
        // Return existing value if it exists
        return response[storageKey];
    }
    return defaultValue;
}

var hasAutoplayFeature = (callback) => {
    getBooleanFeature('autoplay', callback, false);
}

var hasAutoplayFeatureInStorageResponse = (storageResponse) => {
    return parseBooleanFeature(storageResponse, 'autoplay', false)
}
/*** player-bg-common ***/

window.addEventListener('DOMContentLoaded', async () => {
    playerElem = document.getElementById('player');
    chrome.storage.local.get(['mk1-autoplay-origins', 'mk1-feature-autoplay'], (response) => {
        var autoplayForOrigin = false;
        if (hasAutoplayFeatureInStorageResponse(response)) {
            if (Array.isArray(response['mk1-autoplay-origins'])) {
                autoplayOrigins = response['mk1-autoplay-origins'];
            } else {
                // If stored value is not an array, ignore value and use empty array
                autoplayOrigins = [];
            }
            try {
                var parsedContextUrl = new URL(contextUrl);
                var parsedOrigin = parsedContextUrl.origin;
                if (autoplayOrigins.includes(parsedOrigin)) {
                    autoplayForOrigin = true;
                }
                if (!autoplayForOrigin && (parsedContextUrl.origin == 'https://modernkit.one' /* || parsedContextUrl.origin == 'http://127.0.0.1' */) && parsedContextUrl.pathname == '/flash-emulator/player/') {
                    // Always autoplay for our web player, if they have autoplay feature
                    autoplayForOrigin = true;
                }
            } catch(e) {}
        }
        
        var playerParams = '';
        if (autoplayForOrigin) {
            playerParams = '?autoplay=1';
        }
        playerElem.src = '/external/player.html'+playerParams;
    });
});