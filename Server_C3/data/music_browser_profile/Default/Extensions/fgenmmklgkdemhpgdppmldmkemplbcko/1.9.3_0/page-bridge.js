window.addEventListener('message', (evt) => {
    if (!evt.isTrusted) { return; }
    try {
        if (evt.data.action === 'processDetectedSrcsv2') {
            chrome.runtime.sendMessage({action: "processDetectedSrcsv2", detectedSrcsKeyed: evt.data.detectedSrcsKeyed, detectionVersion: evt.data.detectionVersion});
        }
    } catch(e) {}
});