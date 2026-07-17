document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const domainElement = document.getElementById('domain');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const disabledMessage = document.getElementById('disabledMessage');

  toggleSwitch.classList.add('no-animation');

  const isUrlEnabled = async (url) => {
    const { excluded = '' } = await chrome.storage.sync.get('excluded');
    const domains = excluded.split(/[,\n] ?/);
    return !domains.some(domain => url.includes(domain));
  };

  const updateUI = (isEnabled, domain, isRestricted = false) => {
    statusElement.textContent = isRestricted ? 'Not Available' : (isEnabled ? 'Enabled' : 'Disabled');
    domainElement.textContent = domain;
    toggleSwitch.checked = isEnabled;
    toggleSwitch.disabled = isRestricted;

    if (isRestricted) {
      disabledMessage.textContent = 'SmoothScroll cannot run on this page.';
    } else {
      disabledMessage.textContent = '';
    }

    setTimeout(() => {
      toggleSwitch.classList.remove('no-animation');
    }, 100);
  };

  const getCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  };

  const toggleExcludedStatus = async (url) => {
    const { excluded = '' } = await chrome.storage.sync.get('excluded');
    const excludedList = excluded.split(/[,\n] ?/).filter(Boolean);
    const domain = new URL(url).hostname;

    const newExcludedList = excludedList.includes(domain)
      ? excludedList.filter(item => item !== domain)
      : [...excludedList, domain];

    await chrome.storage.sync.set({ excluded: newExcludedList.join(',') });
    updateUI(!newExcludedList.includes(domain), domain);

    // Send message to content script
    const currentTab = await getCurrentTab();  
    chrome.tabs.sendMessage(currentTab.id, {
      action: "toggleSmoothScroll",
      isEnabled: !newExcludedList.includes(domain)
    });
  };

  // chrome returns null url for its internal pages, this might be unneded
  const isRestrictedUrl = (url) => {
    const restrictedPatterns = [
      /^chrome:\/\//,
      /^chrome-extension:\/\//,
      /^https:\/\/chrome\.google\.com\/webstore\//
    ];
    return restrictedPatterns.some(pattern => pattern.test(url));
  };

  const url = (await getCurrentTab()).url;
  // chrome returns null for its internal pages
  if (!url || isRestrictedUrl(url)) {
    return updateUI(false, '', true);
  }


  const isEnabled = await isUrlEnabled(url);
  try {
    const domain = new URL(url).hostname;
    updateUI(isEnabled, domain);
    toggleSwitch.addEventListener('change', () => toggleExcludedStatus(url));
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
});
