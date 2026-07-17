
//
// SmoothScroll (Balazs Galambosi)
// Licensed under the terms of the MIT license.
// The only restriction would be not to publish any  
// extension for browsers or native application
// without getting a written permission first.
//

// TODO: 
// - normalize scroll deltas by zoom level
// - find iframes through shadow DOM
// - support overscroll-behavior

// Scroll Variables (tweakable)
var defaultOptions = {

    // Scrolling Core
    frameRate        : 150, // [Hz]
    animationTime    : 400, // [px]
    stepSize         : 100, // [px]

    // Pulse (less tweakable)
    // ratio of 'tail' to 'acceleration'
    pulseAlgorithm   : true,
    pulseScale       : 4,
    pulseNormalize   : 1,

    // Acceleration
    accelerationDelta : 50,  // 20
    accelerationMax   : 3,   // 1

    // Keyboard Settings
    keyboardSupport   : true,  // option
    arrowScroll       : 50,     // [px]

    // Other
    touchpadSupport   : false,
    fixedBackground   : true, 
    reverseDirection  : false, // for linux users mostly
    excluded          : ''    
};

var options = defaultOptions;


// Other Variables
var isExcluded = false;
var isListening = false;
var isFrame = false;
var direction = { x: 0, y: 0 };
var initDone  = false;
var root = document.documentElement;
var activeElement;
var observer;
var deltaBuffer = [];
var deltaBufferTimer;
var isMac = /^Mac/.test(navigator.platform);
var isWin = /Windows/i.test(navigator.userAgent);
var isLinux =  /Linux/i.test(navigator.userAgent);
var disableQueue = [];


/***********************************************
 * SETTINGS
 ***********************************************/

chrome.storage.sync.get(defaultOptions, function (syncedOptions) {

    options = syncedOptions;

    // it seems that sometimes settings come late
    // and we need to test again for excluded pages
    onOptionsReady();
});


/***********************************************
 * INITIALIZE
 ***********************************************/

/**
 * Tests if smooth scrolling is allowed. Shuts down everything if not.
 */
function onOptionsReady() {

    // disable keyboard support if the user said so
    if (!options.keyboardSupport) {
        removeEvent('keydown', keydown);
    }

    // disable everything if the page is blacklisted
    if (options.excluded) {
        var domains = options.excluded.split(/[,\n] ?/);
        domains.push('mail.google.com'); // exclude Gmail for now
        domains.push('www.youtube.com/shorts');
        for (var i = domains.length; i--;) {
            if (document.URL.indexOf(domains[i]) > -1) {
                isExcluded = true;
                disable();
                return;
            }
        }
    }
}

function init() {
  if (!initDone && document.body) {
    initDone = true;
    // this check is important because before init we cant trust isEnabled
    if (!isExcluded) {
      enable();
    }
  }
}

function whenDisabled(fn) {
  disableQueue.push(fn);
}

function startEventListenersWithCleanup() {
    if (isListening) return;
    isListening = true;
    whenDisabled(_ => isListening = false);
    addEventWithCleanup('wheel', wheel, { passive: false });
    addEventWithCleanup('mousedown', mousedown);
    addEventWithCleanup('keydown', keydown);
    addEventWithCleanup('load', loaded);
}

/**
 * Sets up scrolls array, determines if frames are involved.
 */
function enable() {

    startEventListenersWithCleanup();

    var body = document.body;
    var html = document.documentElement;
    var windowHeight = window.innerHeight; 
    var scrollHeight = body.scrollHeight;
    
    // check compat mode for root element
    root = (document.compatMode.indexOf('CSS') >= 0) ? html : body;
    activeElement = body;

    // Checks if this script is running in a frame
    if (top != self) {
        isFrame = true;
    }

    // TODO: check if clearfix is still needed
    else if (scrollHeight > windowHeight &&
            (body.clientHeight + 1 < body.scrollHeight &&
             html.clientHeight + 1 < html.scrollHeight)) {
        if (root.offsetHeight <= windowHeight) {
            var clearfix = document.createElement('div');   
            clearfix.style.clear = 'both';
            body.appendChild(clearfix);
            whenDisabled(_ => clearfix.remove());
        }
    }

    // disable fixed background
    if (!options.fixedBackground) {
        const bodyAttachment = body.style.backgroundAttachment;
        const htmlAttachment = html.style.backgroundAttachment;
        body.style.backgroundAttachment = 'scroll';
        html.style.backgroundAttachment = 'scroll';
        whenDisabled(_ => {
            body.style.backgroundAttachment = bodyAttachment;
            html.style.backgroundAttachment = htmlAttachment;
        });
    }

    if (!isFrame) {
        const handleMessage = function (e) {
            if (e.data.SS == 'SmoothScroll') {
                var wheelEvent = e.data;
                // TODO: this doesn't work through shadow DOM boundaries
                wheelEvent.target = getFrameByEvent(e);
                wheel(wheelEvent);
            }
        };
        addEventWithCleanup('message', handleMessage);
    }
}

// TODO: this doesn't work through shadow DOM boundaries
function getFrameByEvent(event) {
  var iframes = document.getElementsByTagName('iframe');
  return [].filter.call(iframes, function(iframe) {
    return iframe.contentWindow === event.source;
  })[0];
}

/**
 * Removes event listeners and other traces left on the page.
 */
function disable() {
    while (disableQueue.length) {
        disableQueue.pop()();
    }
}

/**
 * Make sure we are the last listener on the page so special 
 * key event handlers (e.g for <video>) can come before us
 */
function loaded() {
    setTimeout(function () {
        init();
        if (options.keyboardSupport) {
            removeEvent('keydown', keydown);
            addEventWithCleanup('keydown', keydown);
        }
    }, 1);
}


/************************************************
 * SCROLLING 
 ************************************************/
 
var que = [];
var pending = null;
var lastScroll = Date.now();

/**
 * Pushes scroll actions to the scrolling queue.
 */
function scrollArray(elem, left, top) {
    directionCheck(left, top);

    if (options.accelerationMax != 1) {
        var now = Date.now();
        var elapsed = now - lastScroll;
        if (elapsed < options.accelerationDelta) {
            var factor = (1 + (options.accelerationDelta / elapsed)) / 2;
            if (factor > 1) {
                factor = Math.min(factor, options.accelerationMax);
                left *= factor;
                top  *= factor;
                //console.log('factor', factor, 'top', top, 'elapsed', elapsed);
            }
        }
        lastScroll = Date.now();
    }          
    
    // push a scroll command
    que.push({
        x: left, 
        y: top, 
        lastX: (left < 0) ? 0.99 : -0.99,
        lastY: (top  < 0) ? 0.99 : -0.99, 
        start: Date.now()
    });
        
    // don't act if there's a pending frame loop
    if (pending) {
        return;
    }  

    var scrollRoot = getScrollRoot();
    var isWindowScroll = (elem === scrollRoot || elem === document.body);

    // if we haven't already fixed the behavior, 
    // and it needs fixing for this sesh
    // Note: might be removed since we use scrollBy w 'instant'
    if (elem.$scrollBehavior == null && isScrollBehaviorSmooth(elem)) {
        elem.$scrollBehavior = elem.style.scrollBehavior;
        elem.style.scrollBehavior = 'auto';
    }

    var step = function (time) {
        
        var now = Date.now();
        var scrollX = 0;
        var scrollY = 0; 
    
        for (var i = 0; i < que.length; i++) {
            
            var item = que[i];
            var elapsed  = now - item.start;
            var finished = (elapsed >= options.animationTime);
            
            // scroll position: [0, 1]
            var position = (finished) ? 1 : elapsed / options.animationTime;
            
            // easing [optional]
            if (options.pulseAlgorithm) {
                position = pulse(position);
            }
            
            // only need the difference
            var x = (item.x * position - item.lastX) >> 0;
            var y = (item.y * position - item.lastY) >> 0;
            
            // add this to the total scrolling
            scrollX += x;
            scrollY += y;            
            
            // update last values
            item.lastX += x;
            item.lastY += y;
        
            // delete and step back if it's over
            if (finished) {
                que.splice(i, 1); i--;
            }           
        }

        if (window.devicePixelRatio) {
            //scrollX /= (window.devicePixelRatio;
            //scrollY /= window.devicePixelRatio;
        }

        // scroll left and top
        const elemToScroll = isWindowScroll ? window : elem;
        elemToScroll.scrollBy({
          left: scrollX, 
          top: scrollY, 
          // browsers that would ignore this flag, probably
          // don't support problematic 'smooth' behavior anyway
          behavior: 'instant'
        });
        
        // clean up if there's nothing left to do
        if (!left && !top) {
            que = [];
        }
        
        if (que.length) { 
            pending = window.requestAnimationFrame(step); 
        } else { 
            pending = null;
            // restore default behavior at the end of scrolling sesh
            // Note: might be removed since we use scrollBy w 'instant'
            if (elem.$scrollBehavior != null) {
                elem.style.scrollBehavior = elem.$scrollBehavior;
                elem.$scrollBehavior = null;
            }
        }
    };
    
    // start a new queue of actions
    pending = window.requestAnimationFrame(step);
}


/***********************************************
 * EVENTS
 ***********************************************/

/**
 * Mouse wheel handler.
 * @param {Object} event
 */
function wheel(event) {

    init();

    var target = getEventTargetDeep(event);

    // leave early if default action is prevented   
    // or it's a zooming event with CTRL 
    if (event.defaultPrevented || event.ctrlKey) {
        return true;
    }
    
    // leave embedded content alone (flash & pdf)
    if (isNodeName(activeElement, 'embed') || 
       (isNodeName(target, 'embed') && /\.pdf/i.test(target.src)) ||
        isNodeName(activeElement, 'object')) {
        return true;
    }

    // wheelDeltaY (DEPRECATED):
    //   - Mac: positive (+) for scrolling down; Win: negative (-) for up
    //   - Mac & Win: in simple case multiple of 120 or 100 (except Firefox maybe)
    //   - scaled by zoom level (hard to detect, devicePixelRatio affected by ppi)
    // deltaY (NEW):
    //   - Mac: negative (-) for scrolling down; Win: positive (+) for up
    //   - Win: in simple case it's multiple of 300
    //   - Mac: can be any number because of default shitty "acceleration"
    //          some third party apps might change it to line-based (120x)
    //   - scaled by zoom level (hard to detect, devicePixelRatio affected by ppi)
    //
    // For touchpad in Chromium this seems to hold true: 
    //    e.wheelDeltaY === (e.deltaY * -3)
    // but it also holds for mouses on Safari Mac with default "acceleration".
    // Also not future-proof because wheelDeltaY is deprecated
    
    var deltaX = -event.wheelDeltaX || event.deltaX || 0;
    var deltaY = -event.wheelDeltaY || event.deltaY || 0;

    if (isMac) {
        if (event.wheelDeltaX && isDivisible(event.wheelDeltaX, 120)) {
            deltaX = -120 * (event.wheelDeltaX / Math.abs(event.wheelDeltaX));
        }
        if (event.wheelDeltaY && isDivisible(event.wheelDeltaY, 120)) {
            deltaY = -120 * (event.wheelDeltaY / Math.abs(event.wheelDeltaY));
        }
    }

    if (isLinux) { // issues #148 #176 
        var otherModifier = (event.ctrlKey || event.altKey || event.metaKey);
        if (event.shiftKey && !otherModifier) {
            deltaX = deltaX || deltaY;
            deltaY = 0;
        }
    }

    // use wheelDelta if deltaX/Y is not available
    if (!deltaX && !deltaY) {
        deltaY = -event.wheelDelta || 0;
    }

    // line based scrolling
    if (event.deltaMode === 1) {
        deltaX *= 40;
        deltaY *= 40;
    }

    // check if it's a touchpad scroll that should be ignored
    if (!options.touchpadSupport && isTouchpad(deltaY)) {
        return true;
    }

    var xOnly = (deltaX && !deltaY);
    var overflowing = overflowingAncestor(target, xOnly);

    // nothing to do if there's no element that's scrollable
    if (!overflowing) {
        // Chrome iframes seem to eat wheel events, which we need to 
        // propagate up if the iframe has nothing overflowing to scroll
        if (isFrame) {
            event.preventDefault();
            postScrollToParent(deltaX, deltaY);
            // change target to iframe element itself for the parent frame
            //Object.defineProperty(event, "target", {value: window.frameElement});
            //return parent.wheel(event);
        }
        return true;
    }

    if (options.reverseDirection) {
        deltaX *= -1;
        deltaY *= -1;
    }

    // scale by step size
    // delta is 120 most of the time
    // synaptics seems to send 1 sometimes
    if (Math.abs(deltaX) > 1.2) {
        deltaX *= options.stepSize / 120;
    }
    if (Math.abs(deltaY) > 1.2) {
        deltaY *= options.stepSize / 120;
    }
    
    scrollArray(overflowing, deltaX, deltaY);
    if (event.preventDefault) event.preventDefault();
    scheduleClearCache();
}

/**
 * Keydown event handler.
 * @param {Object} event
 */
function keydown(event) {

    var target   = getEventTargetDeep(event);
    var modifier = event.ctrlKey || event.altKey || event.metaKey || 
                  (event.shiftKey && event.code !== 'Space');

    // our own tracked active element could've been removed from the DOM
    if (!document.contains(activeElement)) {
        activeElement = document.activeElement;
    }

    // do nothing if user is editing text
    // or using a modifier key (except shift)
    // or in a dropdown
    // or inside interactive elements
    var inputNodeNames = /^(textarea|select|embed|object)$/i;
    var buttonTypes = /^(button|submit|radio|checkbox|file|color|image)$/i;
    if ( event.defaultPrevented ||
         inputNodeNames.test(target.nodeName) ||
         isNodeName(target, 'input') && !buttonTypes.test(target.type) ||
         isNodeName(activeElement, 'video') ||
         isInsideYoutubeVideo(event) ||
         target.isContentEditable || 
         modifier ) {
      return true;
    }

    // [spacebar] should trigger button press, leave it alone
    if ((isNodeName(target, 'button') ||
         isNodeName(target, 'input') && buttonTypes.test(target.type)) &&
        event.code === 'Space') {
      return true;
    }

    // [arrow keys] on radio buttons should be left alone
    if (isNodeName(target, 'input') && target.type == 'radio' &&
        (event.code === 'ArrowUp' || event.code === 'ArrowDown' || 
         event.code === 'ArrowLeft' || event.code === 'ArrowRight'))  {
      return true;
    }

    var xOnly = (event.code == 'ArrowLeft' || event.code == 'ArrowRight');
    var overflowing = overflowingAncestor(activeElement, xOnly);

    if (!overflowing) {
        // iframes seem to eat key events, which we need to propagate up
        // if the iframe has nothing overflowing to scroll
        return isFrame ? parent.keydown(event) : true;
    }

    var clientHeight = overflowing.clientHeight;
    var shift, x = 0, y = 0;

    if (overflowing == document.body) {
        clientHeight = window.innerHeight;
    }

    switch (event.code) {
        case 'ArrowUp':
            y = -options.arrowScroll;
            break;
        case 'ArrowDown':
            y = options.arrowScroll;
            break;         
        case 'Space':
            shift = event.shiftKey ? 1 : -1;
            y = -shift * clientHeight * 0.9;
            break;
        case 'PageUp':
            y = -clientHeight * 0.9;
            break;
        case 'PageDown':
            y = clientHeight * 0.9;
            break;
        case 'Home':
            if (overflowing == document.body && document.scrollingElement)
                overflowing = document.scrollingElement;
            y = -overflowing.scrollTop;
            break;
        case 'End':
            var scroll = overflowing.scrollHeight - overflowing.scrollTop;
            var scrollRemaining = scroll - clientHeight;
            y = (scrollRemaining > 0) ? scrollRemaining+10 : 0;
            break;
        case 'ArrowLeft':
            x = -options.arrowScroll;
            break;
        case 'ArrowRight':
            x = options.arrowScroll;
            break;            
        default:
            return true; // a key we don't care about
    }

    scrollArray(overflowing, x, y);
    event.preventDefault();
    scheduleClearCache();
}

/**
 * Mousedown event only for updating activeElement
 */
function mousedown(event) {
    activeElement = getEventTargetDeep(event);
}

/**
 * Get the deepest event target even through shadow DOM.
 * @param {Object} event
 * @return {Element}
 */
function getEventTargetDeep(event) {
    return event.composedPath ? event.composedPath()[0] : event.target;
}


/***********************************************
 * OVERFLOW
 ***********************************************/
 
var uniqueID = (function () {
    var i = 0;
    return function (el) {
        return el.uniqueID || (el.uniqueID = i++);
    };
})();

var cacheX = {}; // cleared out after a scrolling session
var cacheY = {}; // cleared out after a scrolling session
var clearCacheTimer;
var smoothBehaviorForElement = {};

//setInterval(function () { cache = {}; }, 10 * 1000);

function scheduleClearCache() {
    clearTimeout(clearCacheTimer);
    clearCacheTimer = setInterval(function () { 
        cacheX = cacheY = smoothBehaviorForElement = {}; 
    }, 1*1000);
}

function setCache(elems, overflowing, isX) {
    var cache = isX ? cacheX : cacheY;
    for (var i = elems.length; i--;)
        cache[uniqueID(elems[i])] = overflowing;
    return overflowing;
}

function getCache(el, isX) {
    return (isX ? cacheX : cacheY)[uniqueID(el)];
}

//  (body)                (root)
//         | hidden | visible | scroll |  auto  |
// hidden  |   no   |    no   |   YES  |   YES  |
// visible |   no   |   YES   |   YES  |   YES  |
// scroll  |   no   |   YES   |   YES  |   YES  |
// auto    |   no   |   YES   |   YES  |   YES  |

function overflowingAncestor(el, isX) {
    var elems = [];
    var body = document.body;
    var rootScrollHeight = root.scrollHeight;
    var rootScrollWidth  = root.scrollWidth;
    while (el) {
        var cached = getCache(el, isX);
        if (cached) {
            return setCache(elems, cached, isX);
        }
        elems.push(el);
        if (isX && rootScrollWidth  === el.scrollWidth ||
           !isX && rootScrollHeight === el.scrollHeight) {
            var topOverflowsNotHidden = overflowNotHidden(root, isX) && overflowNotHidden(body, isX);
            var isOverflowCSS = topOverflowsNotHidden || overflowAutoOrScroll(root, isX);
            if (isFrame && isContentOverflowing(root, isX) || 
               !isFrame && isOverflowCSS) {
                return setCache(elems, getScrollRoot(), isX); 
            }
        } else if (isContentOverflowing(el, isX) && overflowAutoOrScroll(el, isX)) {
            return setCache(elems, el, isX);
        }
        // Support shadow DOM
        el = el.parentElement || (el.getRootNode && el.getRootNode().host); 
    }
}

function isContentOverflowing(el, isX) {
    return isX ? (el.clientWidth  + 10 < el.scrollWidth) 
               : (el.clientHeight + 10 < el.scrollHeight);
}

function computedOverflow(el, isX) {
    var property = isX ? 'overflow-x' : 'overflow-y';
    return getComputedStyle(el, '').getPropertyValue(property);
}

// typically for <body> and <html>
function overflowNotHidden(el, isX) {
    return (computedOverflow(el, isX) != 'hidden');
}

// for all other elements
function overflowAutoOrScroll(el, isX) {
    return /^(scroll|auto)$/.test(computedOverflow(el, isX));
}

// for all other elements
// Note: might be removed since we use scrollBy w 'instant'
function isScrollBehaviorSmooth(el) {
    var id = uniqueID(el);
    if (smoothBehaviorForElement[id] == null) {
        var scrollBehavior = getComputedStyle(el, '')['scroll-behavior'];
        smoothBehaviorForElement[id] = ('smooth' == scrollBehavior);
    }
    return smoothBehaviorForElement[id];
}

function postScrollToParent(deltaX, deltaY) {
    parent.postMessage({
        deltaX: deltaX,
        deltaY: deltaY,
        SS: 'SmoothScroll'
    }, '*');
}


/***********************************************
 * HELPERS
 ***********************************************/

function addEvent(type, fn, arg = false) {
    window.addEventListener(type, fn, arg);
}

function addEventWithCleanup(type, fn, arg = false) {
    const cleanup = () => removeEvent(type, fn, arg);
    addEvent(type, fn, arg);
    whenDisabled(cleanup);
}

function removeEvent(type, fn, arg = false) {
    window.removeEventListener(type, fn, arg);  
}

function isNodeName(el, tag) {
    return el && (el.nodeName||'').toLowerCase() === tag.toLowerCase();
}

function directionCheck(x, y) {
    x = (x > 0) ? 1 : -1;
    y = (y > 0) ? 1 : -1;
    if (direction.x !== x || direction.y !== y) {
        direction.x = x;
        direction.y = y;
        que = [];
        lastScroll = 0;
        window.cancelAnimationFrame(pending);
        pending = null;
    }
}

function isTouchpad(deltaY) {
    if (!deltaY) return;
    if (!deltaBuffer.length) {
        deltaBuffer = [deltaY, deltaY, deltaY];
    }
    deltaY = Math.abs(deltaY);
    deltaBuffer.push(deltaY);
    deltaBuffer.shift();
    clearTimeout(deltaBufferTimer);
    deltaBufferTimer = setTimeout(function () {
        chrome.storage.local.set({ deltaBuffer: deltaBuffer });
    }, 1000);
    var dpiScaledWheelDelta = deltaY > 120 && allDeltasDivisableBy(deltaY); // win64 
    return !allDeltasDivisableBy(120) && !allDeltasDivisableBy(100) && !dpiScaledWheelDelta;
}

function isDivisible(n, divisor) {
    return (Math.floor(n / divisor) == n / divisor);
}

function allDeltasDivisableBy(divisor) {
    return (isDivisible(deltaBuffer[0], divisor) &&
            isDivisible(deltaBuffer[1], divisor) &&
            isDivisible(deltaBuffer[2], divisor));
}

chrome.storage.local.get('deltaBuffer', function (stored) {
    if (stored.deltaBuffer) {
        deltaBuffer = stored.deltaBuffer;
    }
});

function isInsideYoutubeVideo(event) {
    var elem = getEventTargetDeep(event);
    var isControl = false;
    if (document.URL.indexOf ('www.youtube.com/watch') != -1) {
        do {
            isControl = (elem.classList && 
                         elem.classList.contains('html5-video-controls'));
            if (isControl) break;
        } while ((elem = elem.parentNode));
    }
    return isControl;
}

function getScrollRoot() {
    return document.scrollingElement || document.body; // scrolling root in WebKit
}

// @mtoor https://stackoverflow.com/a/12066186
function getZoomLevel() {
    if (!window.outerWidth) return 1; // maybe 0 when window not visible or not focus?
    return window.outerWidth / (window.innerWidth + 16);
}


/***********************************************
 * PULSE (by Michael Herf)
 ***********************************************/
 
/**
 * Viscous fluid with a pulse for part and decay for the rest.
 * - Applies a fixed force over an interval (a damped acceleration), and
 * - Lets the exponential bleed away the velocity over a longer interval
 * - Michael Herf, http://stereopsis.com/stopping/
 */
function pulse_(x) {
    var val, start, expx;
    // test
    x = x * options.pulseScale;
    if (x < 1) { // acceleartion
        val = x - (1 - Math.exp(-x));
    } else {     // tail
        // the previous animation ended here:
        start = Math.exp(-1);
        // simple viscous drag
        x -= 1;
        expx = 1 - Math.exp(-x);
        val = start + (expx * (1 - start));
    }
    return val * options.pulseNormalize;
}

function pulse(x) {
    if (x >= 1) return 1;
    if (x <= 0) return 0;

    if (options.pulseNormalize == 1) {
        options.pulseNormalize /= pulse_(1);
    }
    return pulse_(x);
}

// we disable later if settings came in, but wanna stay fast for most cases
startEventListenersWithCleanup();

// extension popup
chrome.runtime.onMessage.addListener(msg => {
  if (msg.action === "toggleSmoothScroll") {
    isExcluded = !msg.isEnabled;
    msg.isEnabled ? enable() : disable();
  }
});
