
//
// SmoothScroll (Balazs Galambosi)
// Licensed under the terms of the MIT license.
// The only restriction would be not to publish any  
// extension for browsers or native application
// without getting a written permission first.
//

/**
 * A module for middle mouse scrolling.
 */
(function (window) {

var defaultOptions = {
    middleMouse : false,
};

var options = defaultOptions;

var img = document.createElement("div"); // img at the reference point
var scrolling = false; // guards one phase


// we check the OS for default middle mouse behavior only!
var isLinux = (navigator.platform.indexOf("Linux") != -1); 

// get global settings
chrome.storage.sync.get(defaultOptions, function (syncedOptions) {
    options = syncedOptions;
    // leave time for the main script to check excluded pages
    setTimeout(function() {
        // if we shouldn't run, stop listening to events
        if (isExcluded && !options.middleMouse) {
            cleanup();
        }
    }, 10);
});

 
/**
 * Initializes the image at the reference point.
 */
function init() {
    var url = chrome.runtime.getURL("../img/cursor.svg");
    var style = img.style;
    style.background = "url("+url+") no-repeat";
    style.position   = "fixed";
    style.zIndex     = "1000";
    style.width      = "20px";
    style.height     = "20px";
    new Image().src  = url; // force download
}

/**
 * Removes event listeners and other traces left on the page.
 */
function cleanup() {
    removeEvent("mousedown", mousedown);
}

/**
 * Shows the reference image, and binds event listeners for scrolling.
 * It also manages the animation.
 * @param {Object} event
 */
function mousedown(e) {

    // use default action if we're disabled
    // or it's not the midde mouse button
    if (!options.middleMouse || e.button !== 1) {
        return true;
    }

    //var isLink = false;
    var elem   = getEventTargetDeep(e);
    
    // linux middle mouse shouldn't be overwritten (paste)
    var isLinuxInput = (isLinux && (/input|textarea/i.test(elem.nodeName) || 
                                    elem.isContentEditable));

    /*
    do {
        isLink = isNodeName(elem, "a");
        if (isLink) break;
    } while ((elem = elem.parentNode));
    */
        
    elem = overflowingAncestor(e.target);
    
    // if it's problematic element
    // take the default action
    if (!elem || isLinuxInput) {
        return true;
    }
    
    // Note: now we allow links to be scrolled
    // we don't want the default by now
    //e.preventDefault();
    
    // quit if there's an ongoing scrolling
    if (scrolling) {
        return false;
    }
    
    // set up a new scrolling phase (global)
    scrolling = true;
 
    var refereceX = e.clientX;
    var refereceY = e.clientY;

    var speedX = 0;
    var speedY = 0;
    
    // session variable
    var finished = false;

    var isWindowScroll = (elem === getScrollRoot() || elem === document.body);
    var scrollElement = isWindowScroll ? window : elem;

    // wait to see if the mouse moves enough to scroll
    var firstMove = true;

    // TODO: wait a bit, and if there's no movement, send simulated mousedown
    // this ensures that any element that relies on this event gets it
    // for cases where there is no scrolling expected

    function start() {
        // reference point (not affected by css zoom property)
        img.style.left = (e.clientX / window.innerWidth * 100) + '%';
        img.style.top = (e.clientY / window.innerHeight * 100) + '%';
        document.body.appendChild(img);

        var last = dateNow();

        window.requestAnimationFrame(function step(time) {
            if (finished) {
              return;
            }
            var now = dateNow();
            var elapsed = now - last;
            scrollElement.scrollBy({
                left: speedX * elapsed,
                top: speedY * elapsed,
                behavior: 'instant'
            });
            last = now;
            window.requestAnimationFrame(step);
        });
    }

    function mousemove(e) {
        var deltaX = e.clientX - refereceX;
        var deltaY = e.clientY - refereceY;
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        var movedEnough = distance > 3; 

        var maxDistance = 300; // Maximum distance to consider
        var minSpeed = 0.001; // Minimum speed
        var maxSpeed = 10; // Maximum speed      
        var speedFactor = Math.min(distance / maxDistance, 1);
        var speed = minSpeed + (maxSpeed - minSpeed) * speedFactor;

        speedX = (deltaX / distance) * speed;
        speedY = (deltaY / distance) * speed;
      
        if (firstMove && movedEnough) {
          firstMove = false;
          start();
      }
    }
    
    function stop(e) {
        scrolling = false;
        finished  = true;
        removeEvent("mousemove", mousemove);
        removeEvent("mousedown", stop);
        removeEvent("mouseup", stop);
        removeEvent("keydown", stop);
        img.remove();
    }
    
    addEvent("mousemove", mousemove);
    addEvent("mousedown", stop);
    addEvent("mouseup", stop);
    addEvent("keydown", stop);
}

/**
 * performance.now with fallback
 */
var dateNow = (function () {
  return (window.performance && performance.now) 
        ? function () { return performance.now(); }
        : function () { return Date.now(); };
})();

addEvent("mousedown", mousedown);
addEvent("DOMContentLoaded", init);

})(window);
