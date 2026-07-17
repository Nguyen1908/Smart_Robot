var upgradeBtn = document.getElementById('upgrade-btn');

upgradeBtn.addEventListener('click', (e) => {
   chrome.runtime.sendMessage({
        action: "openNewTab",
        url: "https://modernkit.one/flash-emulator/upgrade/?utm_source=extension-playlimitnotice&utm_medium=extension&utm_content=ext-playlimitnotice-button"
    }); 
});

var upgradeLogo = document.getElementById('upgrade-logo');

upgradeLogo.addEventListener('click', (e) => {
   chrome.runtime.sendMessage({
        action: "openNewTab",
        url: "https://modernkit.one/flash-emulator/upgrade/?utm_source=extension-playlimitnotice&utm_medium=extension&utm_content=ext-playlimitnotice-logo"
    }); 
});