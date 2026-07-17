/***
Alternate Flash detection logic used for specific websites.
We use this to detect when the page is ready to run our content script, instead of handling ourselves in event listeners.
When this is loaded, we tell background script to call main world script with arguments
This is registered as a content script, so browser handles events and pattern matching for us.
***/
if (document.contentType == 'text/html' || document.contentType == 'application/xhtml+xml') { // Only run in HTML documents
    try {
        chrome.runtime.sendMessage({action: 'startAlternateDetection'});
    } catch(e) {}
}