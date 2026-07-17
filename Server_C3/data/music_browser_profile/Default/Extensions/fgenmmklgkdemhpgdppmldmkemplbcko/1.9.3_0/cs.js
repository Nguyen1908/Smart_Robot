/*** Content Script to find and play embedded content ***/

//console.info('Content script: Find and play loaded.');

var items;

var isValid = (itemSrc) => {
    return (typeof itemSrc != 'undefined' && itemSrc != null && itemSrc != '');
}

var normalizeUrl = (itemSrc) => {
    // Second param is base URL
    try {
        // For absolute URLs (will throw exception on relative URLs)
        return new URL(itemSrc).href;
    } catch(e) {
        try {
            // For relative URLs
            return new URL(itemSrc, window.location.href).href;
        } catch(e) {
            // Invalid URLs should never work anyway
        }
    }
    return false;
}

var findElements = () => {

    var elems = [
    ...document.querySelectorAll('embed'),
    ...document.querySelectorAll('object'),
    ...document.querySelectorAll('[type="application/x-shockwave-flash"]'),
    ...document.querySelectorAll('[classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"]'),
    ...document.querySelectorAll('[src*=".swf"]'),
    // selector is case-sensitive
    ...document.querySelectorAll('[src*=".SWF"]')
    ];

    items = [];

    //console.info('Elements:', elems);

    elems.forEach((elem) => {

        if (elem.dataset.swfProcessed === 'true') {
            //console.info('Element already processed', elem);
            return;
        }

        var embedElemWithin = elem.querySelector('embed');

        if (elem.nodeName.toLowerCase() == 'object' && embedElemWithin !== null) {
            console.info('Object with embed found. Ignoring object, preferring embed.');
            return;
        }
        
        var item = {};
        item.src = elem.src || elem.data;
        
        if (!isValid(item.src)) {
            var paramMovie = elem.querySelector('param[name="movie"]');
            if (paramMovie) {
                item.src = paramMovie.value;
            }
        }
        
        // Media type registries (prefixes) from https://www.iana.org/assignments/media-types/media-types.xhtml
        var srcIsValid = isValid(item.src);
        var lowercaseSrc = (srcIsValid) ? item.src.toLowerCase() : null;
        if (srcIsValid &&
        elem.type.indexOf('audio/') == -1 &&
        elem.type.indexOf('font/') == -1 &&
        elem.type.indexOf('example/') == -1 &&
        elem.type.indexOf('image/') == -1 &&
        elem.type.indexOf('message/') == -1 &&
        elem.type.indexOf('model/') == -1 &&
        elem.type.indexOf('multipart/') == -1 &&
        elem.type.indexOf('text/') == -1 &&
        elem.type.indexOf('video/') == -1 &&
        elem.type != 'application/pdf' &&
        // Shockwave (Director) content, not Flash content
        // Consider also excluding clsid:166B1BCA-3F9C-11CF-8075-444553540000
        elem.type != 'application/x-director' &&
        lowercaseSrc.indexOf('.dcr') == -1 &&
        lowercaseSrc.indexOf('.pdf') == -1 &&
        // Exclude .html, .htm embeds if at end of src URL
        lowercaseSrc.indexOf('.html') == -1 &&
        lowercaseSrc.indexOf('.htm') == -1 &&
        // Exclude .svg, other media embeds if at end of src URL
        lowercaseSrc.indexOf('.svg') == -1 &&
        lowercaseSrc.indexOf('.mp4') == -1 &&
        lowercaseSrc.indexOf('.mp3') == -1 &&
        lowercaseSrc.indexOf('.jpg') == -1 &&
        lowercaseSrc.indexOf('.png') == -1 &&
        lowercaseSrc.indexOf('.ogg') == -1 &&
        lowercaseSrc.indexOf('.webm') == -1 &&
        lowercaseSrc.indexOf('.mov') == -1 &&
        // Exclude Flash YouTube player
        lowercaseSrc.indexOf('www.youtube.com/v/') == -1 &&
        lowercaseSrc.indexOf('www.youtube-nocookie.com/v/') == -1
        ) {
            item.src = normalizeUrl(item.src);
            if (item.src !== false) {
                item.elem = elem;
                elem.dataset.swfProcessed = true;
                item.flashvars = elem.getAttribute('flashvars') || '';
                items.push(item);
            }
        }
    });

    //console.info('Items:', items.length, items[0]);
    
    return items;

}

var copyDataset = (originalDataset, newDataset) => {
    Object.entries(originalDataset).forEach((dataItem) => {
        newDataset[dataItem[0]] = dataItem[1];
    });
}

var copyAttributes = (originalElem, newElem) => {
    if (originalElem.classList.length) {
        newElem.classList = originalElem.classList; // DOMTokenList
    }
    copyDataset(originalElem.dataset, newElem.dataset);
}

var addContainer = (item) => {
    //console.info('Adding container/overlay for', item);

    var originalId = item.elem.id;
    var originalDomRect = item.elem.getBoundingClientRect();

    item.containerElem = document.createElement('div');
    
    item.containerShadowElem = item.containerElem.attachShadow({mode: 'open'});
    
    copyAttributes(item.elem, item.containerElem);
    item.containerElem.classList.add('ext-modernkit-flash-player-container');
    
    // Try rendered dimensions, fallback to attributes, then fallback to hardcoded values. Attribute fallback handles cases where embed is rendered with 0 width/height, but has defined dimensions in attributes; this is known to occur in Firefox.
    // Note: 'px' suffix not needed in Chromium but is needed in Firefox. Chromium will use px as default unit if none is defined. Some attribute values may be percentages, so we check if it's a number before appending 'px'.
    item.width = originalDomRect.width;
    item.height = originalDomRect.height;
    // < 120 value in DomRect is known to occur in Firefox
    // Use 120 because official "Get Flash Player" button is 112px: https://www.adobe.com/images/shared/download_buttons/get_flash_player.gif
    if (item.width < 120) { 
        item.width = (item.elem.getAttribute('width') || 500);
    }
    if (item.height < 120) {
        item.height = (item.elem.getAttribute('height') || 500);
    }
    
    // Append 'px' if a number, or if a string without 'px' or '%'
    if (typeof item.width == 'number' || (typeof item.width == 'string' && item.width.toLowerCase().indexOf('px') == -1 && item.width.indexOf('%') == -1)) {
        item.width = item.width+'px';
    }
    if (typeof item.height == 'number' || (typeof item.height == 'string' && item.height.toLowerCase().indexOf('px') == -1 && item.height.indexOf('%') == -1)) {
        item.height = item.height+'px';
    }
    
    if (item.containerElem.dataset.mk1UseMetadataDimensions === 'true') {
        item.width = '200px';
        item.height = '200px';
    }
    
    item.containerElem.style.width = item.width;
    item.containerElem.style.height = item.height;

    item.elem.parentNode.insertBefore(item.containerElem, item.elem);
    item.elem.remove();
    
    if (originalId != '') {
        item.containerElem.id = originalId; // Should only set id after removing original element, otherwise two elements would have same id
    }
    
    addPlayer(item);
    
}

const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;

var addPlayer = (item) => {
    //console.info('Adding player for', item);
    
    if (item.containerElem.dataset.swfContainsPlayer) {
        console.info('Player already loaded for this item.');
        return;
    }
    
    item.containerElem.dataset.swfContainsPlayer = true;
    
    item.playerElem = document.createElement('iframe');
    item.playerElem.classList.add('ext-modernkit-flash-player-frame');
    if (!isFirefox) {
      // Sandbox everywhere except in Firefox.
      // In FF, we need chrome.runtime.sendMessage access in player-embed.html which is not provided to sandboxed frames.
      item.playerElem.sandbox = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
    }
    item.playerElem.referrerPolicy = 'no-referrer';
    item.playerElem.allow = 'autoplay; fullscreen';
    
    // Get directory URL. For top-level URLs, will be '/' (pathEndPosition=0).
    var basePath = window.location.pathname;
    var pathEndPosition = basePath.lastIndexOf('/');
    if (pathEndPosition > -1) {
      basePath = basePath.substring(0, pathEndPosition + 1);
    }
    var baseUrl = window.location.origin + basePath;
    
    var playerWidth = item.width;
    var playerHeight = item.height;
    
    if (item.containerElem.dataset.mk1UseMetadataDimensions === 'true') {
        playerWidth = 'auto';
        playerHeight = 'auto';
    }
    
    item.playerElem.src = chrome.runtime.getURL('external/player-embed.html?src='+encodeURIComponent(item.src)+'&width='+playerWidth+'&height='+playerHeight+'&flashvars='+encodeURIComponent(item.flashvars)+'&baseUrl='+encodeURIComponent(baseUrl)+'&contextUrl='+encodeURIComponent(window.location.href));

    item.containerShadowElem.appendChild(item.playerElem);
}

var initializePage = (callback) => {
    // Add CSS if we'll add container/overlay or player
    chrome.runtime.sendMessage({action: "addPageCSS"}, callback);
}

var init = (callback) => {
    
    //console.info('Content script: Find and play running.');

    if (document.contentType != 'text/html' && document.contentType != 'application/xhtml+xml') {
        // Possibly XML document or something else, ignore
        return;
    }

    items = findElements();

    if (items.length) {
      // Only initialize page if we have items on page
      initializePage(() => {
          
        setTimeout(() => {
            // Callback after CSS is injected
            items.forEach((item) => {
                addContainer(item);
            });

            //console.info('Content script: Find and play finished.');
            if (typeof callback == 'function') {
                callback();
            }
            
        }, 1); // Delay to ensure CSS is processed and prevent jumping/flashing
      });
    }

};

//init();
// Slight delay needed to allow DOM tree to settle (mainly an issue in object-embed-compat.html)
setTimeout(init, 100);
//setTimeout(init, 1200);
//setTimeout(init, 5500);

var canUpdatePlayerDimensions = () => {
    // For now, assumes single player in page, since this should only be used in our web player
    if (items.length == 0) {
        console.error('Cannot update player dimensions if there are no items.');
        return false;
    }
    if (items.length > 1) {
        console.error('Cannot update player dimensions with more than one item on page.');
        return false;
    }
    if (items[0].containerElem.dataset.mk1UseMetadataDimensions !== 'true') {
        console.error('Not updating player dimensions because it does not use metadata dimensions.');
        return false;
    }
    return true;
}

var updatePlayerDimensions = (width, height) => {
    if (!canUpdatePlayerDimensions()) {
        return false;
    }
    items[0].width = width + 'px';
    items[0].height = height + 'px';
    items[0].containerElem.style.width = items[0].width;
    items[0].containerElem.style.height = items[0].height;
    return true;
}

var updateInternalPlayerDimensions = (width, height) => {
    if (!canUpdatePlayerDimensions()) {
        return false;
    }
    
    items[0].width = width + 'px';
    items[0].height = height + 'px';
    items[0].containerElem.style.width = items[0].width;
    items[0].containerElem.style.height = items[0].height;
    
    items[0].playerElem.contentWindow.postMessage({action: "updateInternalPlayerDimensions", width: items[0].width, height: items[0].height}, '*');
}

var increaseInternalPlayerDimensions = () => {
    if (!canUpdatePlayerDimensions()) {
        return false;
    }
    
    // Width and height will always be suffixed with 'px' in our web player
    // If in the future we use this function outside web player, we may need to make this more robust to handle other units
    var width = items[0].width;
    width = width.substring(0, width.indexOf('px'));
    var height = items[0].height;
    height = height.substring(0, height.indexOf('px'));

    width = Math.round(width * 1.075);
    height = Math.round(height * 1.075);

    updateInternalPlayerDimensions(width, height);
    return true;
}
var decreaseInternalPlayerDimensions = () => {
    if (!canUpdatePlayerDimensions()) {
        return false;
    }
    
    // Width and height will always be suffixed with 'px' in our web player
    // If in the future we use this function outside web player, we may need to make this more robust to handle other units
    var width = items[0].width;
    width = width.substring(0, width.indexOf('px'));
    var height = items[0].height;
    height = height.substring(0, height.indexOf('px'));
    
    width = Math.round(width * 0.925);
    height = Math.round(height * 0.925);
    
    updateInternalPlayerDimensions(width, height);
    return true;
}

chrome.runtime.onMessage.addListener((msg, msgSender, sendResponse) => {
    if (msgSender.id !== chrome.runtime.id) {
        console.error('Content Script received message from invalid extension ID or a non-extension.');
        sendResponse(false);
        return true;
    }
    if (!msg.actionForCS) {
       console.error('Content Script received unrecognized message');
       return;
   }
    
    if (msg.actionForCS == 'findElementsAndInitPlayers') {
        init(() => {
            // Line below required for callback to work
            sendResponse(true);
        });
    } else if(msg.actionForCS == 'updatePlayerDimensions' && msg.width && msg.height) {
        sendResponse(updatePlayerDimensions(msg.width, msg.height));
        try {
            // Enable resize buttons after player has final dimensions
            document.getElementById('increasePlayerDimensionsBtn').disabled = false;
            document.getElementById('decreasePlayerDimensionsBtn').disabled = false;
        } catch(e) {}
    } else if(msg.actionForCS == 'increaseInternalPlayerDimensions') {
        sendResponse(increaseInternalPlayerDimensions());
    } else if(msg.actionForCS == 'decreaseInternalPlayerDimensions') {
        sendResponse(decreaseInternalPlayerDimensions());
    } else {
        console.info('Content Script received unexpected message.');
    }
    
    // Line below required for callback to work
    return true;
});
