try {
    var storageResponse = await chrome.storage.local.get('is-mv3-data-migrated');
    var isDataMigrated = storageResponse?.['is-mv3-data-migrated'];
    if (isDataMigrated) {
        chrome.runtime.sendMessage({action: 'closeMv3UpgradeTab'});
    } else {
        var uuid = localStorage.getItem('mk1-uuid');
        if (!uuid) {
            // Generate UUID if it does not exist
            uuid = crypto.randomUUID();
        }
        await chrome.storage.local.set({'mk1-uuid': uuid});
        await chrome.storage.local.set({'is-mv3-data-migrated': true});
        chrome.runtime.sendMessage({action: 'closeMv3UpgradeTab'});
    }
} catch(e) {
    // Fallback in case of error
    chrome.runtime.sendMessage({action: 'closeMv3UpgradeTab'});
}
// Fallback in case this takes too long
setTimeout(async () => {
    chrome.runtime.sendMessage({action: 'closeMv3UpgradeTab'});
}, 5000);