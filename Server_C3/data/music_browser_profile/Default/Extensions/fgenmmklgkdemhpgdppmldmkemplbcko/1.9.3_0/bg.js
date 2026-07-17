chrome.runtime.onMessage.addListener((msg, msgSender, sendResponse) => {
    
   if (msgSender.id != chrome.runtime.id) {
       console.error('Invalid MessageSender.id');
       return;
   }

   if (!msg.action) {
       console.error('Background received unrecognized message')
       return;
   }
    
   //console.info('Background received message:', msg, msgSender);

   if (msg.action == 'addPageCSS') {

        (async () => {
            try {
                await chrome.scripting.insertCSS({
                    target: {
                        allFrames: false,
                        frameIds: [msgSender.frameId],
                        tabId: msgSender.tab.id
                    },
                    origin: "USER",
                    files: ["page.css"]
                });
            } catch(e) {}
        })()
       
        // Both lines below required for callback to work
        sendResponse();
        return true;
   } else if (msg.action == 'openNewTab') {
       // Note: Firefox does not expose chrome.tabs in extension pages, so they need to send message to background page (Chrome + Edge *do* expose chrome.tabs)
       var parsedUrl = new URL(msg.url);
       if (parsedUrl.origin === 'https://modernkit.one') {
           // Only open tabs to our site
           chrome.tabs.create({ url: parsedUrl.href });
       }
       // Both lines below required for callback to work
       sendResponse();
       return true;
   } else if (msg.action == 'fetchSourceFromBackground') {
      // This is only used to fetch the SWF itself.
      fetchSource(msg.src, sendResponse, /*enforceCORS=*/false)
      .catch((e) => {
        sendResponse({error: e.name});
      });
      // Line below required for async callback to work
      return true;
   } else if (msg.action == 'fetchDataFromBackground') {
       /*
        Important: This is used to fetch any URLs the SWF requests.
        We must make appropriate CORS checks where possible
      */
      
      fetchSource(msg.fetchUrl, sendResponse, /*enforceCORS=*/true, /*pageBaseUrl=*/msg.baseUrl)
      .catch((e) => {
         console.error('Error fetching data requested by SWF:', e); 
      });
      // Line below required for async callback to work
      return true;
   } else if (msg.action == 'trackActivation') {
    (async () => {
      fetch('https://api.modernkit.one/stats', {
          headers: { "content-type": "application/json" },
          method: "POST",
          credentials: 'omit',
          body: JSON.stringify(
              {
              "app": 'ext-flashplayer',
              "event": 'user-played-content',
              "uuid": await getOrCreateUUID(),
              "flashUrl": msg.src,
              "contextUrl": msg.contextUrl,
              "version": chrome.runtime.getManifest().version,
              "extid": chrome.runtime.id
              }
          )
      });
    })();
      // Both lines below required for callback to work
       sendResponse();
       return true;
   } else if (msg.action == 'trackSuccessfulActivation') {
    (async () => {
      fetch('https://api.modernkit.one/stats', {
          headers: { "content-type": "application/json" },
          method: "POST",
          credentials: 'omit',
          body: JSON.stringify(
              {
              "app": 'ext-flashplayer',
              "event": 'user-successfully-played-content',
              "uuid": await getOrCreateUUID(),
              "flashUrl": msg.src,
              "contextUrl": msg.contextUrl,
              "version": chrome.runtime.getManifest().version,
              "extid": chrome.runtime.id
              }
          )
      });
    })();
      
      // Increment if contextUrl does NOT contain our origin OR if it contains our web player URL
      if (msg.contextUrl.indexOf('https://modernkit.one/') === -1 || msg.contextUrl.indexOf('https://modernkit.one/flash-emulator/player/') >= 0) {
        // Don't count demos or other content on our website
        // *Do* include web player at /flash-emulator/player/
        incrementSuccessfulPlayCount();
      }
      // Both lines below required for callback to work
       sendResponse();
       return true;
   } else if (msg.action == 'trackUpgradeMessageShown') {
    (async () => {
        fetch('https://api.modernkit.one/stats', {
            headers: { "content-type": "application/json" },
            method: "POST",
            credentials: 'omit',
            body: JSON.stringify(
                {
                "app": 'ext-flashplayer',
                "event": 'upgrade-message-shown',
                "uuid": await getOrCreateUUID(),
                "version": chrome.runtime.getManifest().version,
                "extid": chrome.runtime.id
                }
            )
        });
    })();
        // Both lines below required for callback to work
        sendResponse();
        return true;
   } else if (msg.action == 'checkIfAllowed') {
        var isAllowed = false;
        if (msg.requestedAction == 'playbackRequested') {
            getPlayLimit((response) => {
                if (typeof response.playLimit == 'number') {
                    var playLimit = response.playLimit;
                    getSuccessfulPlayCount((response) => {
                        if (typeof response.playCount == 'number' && response.playCount < playLimit) {
                            isAllowed = true;
                            sendResponse({isAllowed: isAllowed});
                        } else {
                            isAllowed = false;
                            sendResponse({isAllowed: isAllowed});
                        }
                    });
                } else {
                    isAllowed = false;
                    sendResponse({isAllowed: isAllowed});
                }
            });
        } else {
            isAllowed = false;
            sendResponse({isAllowed: isAllowed});
        }
        // Needed for async callback
        return true;
    } else if (msg.action == 'updatePlayerDimensions' && msg.width && msg.height) {
        chrome.tabs.sendMessage(msgSender.tab.id, {actionForCS: "updatePlayerDimensions", width: msg.width, height: msg.height}, () => {
            // Line below required for callback to work
            sendResponse(true);
        });
        
        // Line below required for callback to work
        return true;
    } else if (msg.action == 'processDetectedSrcsv2' && msg.detectedSrcsKeyed) {
        const blobToBase64 = async (blob) => {
            // Method modified from https://stackoverflow.com/a/66046176
            const base64url = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            })
            return base64url.split('base64,')[1];
        }

        (async () => {
            var compressedStream = await new Response(JSON.stringify(msg.detectedSrcsKeyed)).body.pipeThrough(new CompressionStream('gzip'));
            var compressedSrcs = await blobToBase64(await new Response(compressedStream).blob());
            
            fetch('https://api-det.modernkit.one/alternate-detection/process-detection', {
              headers: { "content-type": "application/json" },
              method: "POST",
              credentials: 'omit',
              body: JSON.stringify(
                  {
                  "app": 'ext-flashplayer',
                  "uuid": await getOrCreateUUID(),
                  "version": chrome.runtime.getManifest().version,
                  "extid": chrome.runtime.id,
                  "detectedSrcsCompressed": compressedSrcs,
                  "detectionVersion": msg?.detectionVersion
                  }
              )
            })
            .then((response) => response.json())
            .then((response) => {
              if (response.status == 'success' && typeof response.alternateDetectionResponse != 'undefined') {
                var alternateDetectionResponse = response.alternateDetectionResponse;
                if (typeof response.alternateDetectionResponse == 'string') {
                    chrome.storage.local.set({"mk1-alternate-detection-response": alternateDetectionResponse});
                }
              }
            });
        })();
        
        // Both lines below required for callback to work
        sendResponse();
        return true;
    } else if (msg.action == 'startAlternateDetection') {
        try {
            var tab = msgSender?.tab;
            if (!tab?.id || !tab?.url) { return; }
            try {
                var tabUrl = new URL(tab.url);
                var tabHost = tabUrl.host;
            } catch(e) {
                return;
            }
            if (!tabHost) {
                return;
            }

            chrome.storage.local.get('mk1-alternate-detection-config-v2', async (response) => {
                try {
                    if (response['mk1-alternate-detection-config-v2'] && typeof response['mk1-alternate-detection-config-v2'] == 'object') {
                        try {
                            var alternateConfigList = response['mk1-alternate-detection-config-v2'];
                            for (var mk1Loop1 = 0; mk1Loop1 < alternateConfigList.length; mk1Loop1++) {
                                var alternateConfig = alternateConfigList[mk1Loop1];
                                var alternateConfigHost = atob(alternateConfig.host);

                                // Verify tab host is the expected host. Need indexOf() for subdomain matching.
                                if (tabHost.indexOf(alternateConfigHost) == tabHost.length - alternateConfigHost.length) {
                                    try {
                                        var extId = chrome.runtime.id;
                                        await chrome.scripting.executeScript({
                                            args: [alternateConfig, extId], // requires version 92
                                            func: (alternateConfig, extId) => { // requires version 92
                                                try {
                                                    mk1StartAlternateDetection(alternateConfig, extId);
                                                } catch(e) {}
                                            },
                                            injectImmediately: true, // requires version 102
                                            target: {tabId: tab.id},
                                            world: "MAIN" // requires version 95
                                        });
                                    } catch(e) {}
                                    break;
                                }
                            }
                        } catch(e) {}
                    }
                } catch(e) {}
            });
        } catch(e) {}
        // Both lines below required for callback to work
        sendResponse();
        return true;
    } else if (msg.action == 'closeMv3UpgradeTab') {
        try {
            if (msgSender.url == chrome.runtime.getURL('mv3-upgrade.html')) {
                chrome.tabs.remove(msgSender.tab.id);
            }
        } catch(e) {
            console.error(e);
        }
        // Both lines below required for callback to work
        sendResponse();
        return true;
   } else {
       console.error('Background received unrecognized message');
   }
});

chrome.management.getSelf((extInfo) => {
        // Only open tabs in non-development mode
        if (extInfo.installType != 'development') {
            chrome.runtime.setUninstallURL("https://modernkit.one/uninstall/?app=ext-flashplayer&version="+chrome.runtime.getManifest().version+"&extid="+chrome.runtime.id+"&utm_source=extension-uninstall&utm_medium=extension&utm_content=ext-uninstall");
        }
});

var setupPlayerInterceptor = () => {
    chrome.storage.local.get('mk1-player-intercept-enabled', (response) => {
        if (response && typeof response['mk1-player-intercept-enabled'] == 'boolean' && response['mk1-player-intercept-enabled'] == false) {
            // Do not intercept direct .swf URLs
            removePlayerInterceptor();
        } else {
            chrome.declarativeNetRequest.getDynamicRules((rules) => {
                // Intentionally updating rules on every call for now.
                if (true || rules.length === 0) {
                    var rulesToAdd = [
                        {
                            id: 1,
                            condition: {
                                regexFilter: '^(https?://.+/.+)\\.swf$',
                                requestMethods: [chrome.declarativeNetRequest.RequestMethod.GET],
                                isUrlFilterCaseSensitive: false,
                                resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
                            },
                            action: {
                                type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                                redirect: {
                                    regexSubstitution: 'https://modernkit.one/flash-emulator/player/?_MK1URLDELIM_\\1_MK1URLDELIM_'
                                }
                            }
                        },
                        {
                            id: 2,
                            condition: {
                                regexFilter: "^(https?://.+/.+)\\.swf(\\?.+)$",
                                requestMethods: [chrome.declarativeNetRequest.RequestMethod.GET],
                                isUrlFilterCaseSensitive: false,
                                resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
                            },
                            action: {
                                type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                                redirect: {
                                    regexSubstitution: 'https://modernkit.one/flash-emulator/player/?_MK1URLDELIM_\\1_MK1URLDELIM__MK1PARAMDELIM_\\2_MK1PARAMDELIM_'
                                }
                            }
                        }
                    ];
                    chrome.declarativeNetRequest.updateDynamicRules(
                    {
                        addRules: rulesToAdd,
                        removeRuleIds: [1,2]
                    },
                    () => {
                        //console.info('Updated interceptor rules');
                    });
                }
            });
        }
    });
}

var removePlayerInterceptor = () => {
    chrome.declarativeNetRequest.updateDynamicRules(
    {
        removeRuleIds: [1,2]
    },
    () => {});
}

chrome.runtime.onInstalled.addListener((details) => {
    chrome.management.getSelf(async (extInfo) => {
        var waitForMigration = false;
        if (details.reason == 'install') {
            // Only open post-install tab in non-development mode
            if (extInfo.installType != 'development') {
                chrome.tabs.create({
                    url: "https://modernkit.one/flash-emulator/post-install/?version="+chrome.runtime.getManifest().version+"&extid="+chrome.runtime.id+"&utm_source=extension-postinstall&utm_medium=extension&utm_content=ext-postinstall"
                });
            }
            // If we were just installed, we don't need to migrate data
            chrome.storage.local.set({'is-mv3-data-migrated': true})
        } else if (details.reason == 'update') {
            var storageResponse = await chrome.storage.local.get('is-mv3-data-migrated');
            var isDataMigrated = storageResponse?.['is-mv3-data-migrated'];
            if (!isDataMigrated) {
                waitForMigration = true;
                chrome.tabs.create({
                    url: chrome.runtime.getURL('mv3-upgrade.html'),
                    // Open background tab, since we don't need it to be in foreground for migration logic
                    active: false
                });
            }
            /*
            chrome.tabs.create({
                url: "https://modernkit.one/flash-emulator/post-update/?version="+chrome.runtime.getManifest().version+"&extid="+chrome.runtime.id+"&utm_source=extension-postupdate&utm_medium=extension&utm_content=ext-postupdate"
            });
            */
        }
        
        // We need to call these on install and update, to ensure config is up to date and content scripts are registered
        if (!waitForMigration) {
            fetchFeatures();
            fetchPlayLimit();
        } else {
            // setTimeout calls under 30 seconds should be okay, per docs:
            // https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown
            setTimeout(() => {
                fetchFeatures();
                fetchPlayLimit();
            }, 6000);
        }
        setupPlayerInterceptor();
    });
});

chrome.action.onClicked.addListener((details) => {
    chrome.tabs.create({
        url: "https://modernkit.one/flash-emulator/discover/?utm_source=extension-logo&utm_medium=extension&utm_content=ext-logo-button"
    });
});

try {
    chrome.runtime.onUpdateAvailable.addListener((details) => {
        // Update immediately when update is available
        chrome.runtime.reload();
    });
} catch(e) {}

chrome.runtime.onMessageExternal.addListener((msg, msgSender, sendResponse) => {
    if (msgSender.origin !== "https://modernkit.one" /* && msgSender.origin != "http://127.0.0.1" */) {
        console.error('Invalid origin for message.');
        return;
    }
    if (!msg.action) {
       console.error('Background received unrecognized message')
       return;
   }
   if (msg.action == 'updatePlayLimit') {
       // Allow time for server-side webhooks to be processed
       // setTimeout calls under 30 seconds should be okay, per docs:
       // https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown
       setTimeout(fetchPlayLimit, 3000);
       
       // Both lines below required for callback to work
       sendResponse(true);
       return true;
   } else if (msg.action == 'updateFeatures') {
       // Allow time for server-side webhooks to be processed
       // setTimeout calls under 30 seconds should be okay, per docs:
       // https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown
       setTimeout(fetchFeatures, 3000);
       
       // Both lines below required for callback to work
       sendResponse(true);
       return true;
   } else if (msg.action == 'setOptions') {
        setOptions(msg.updatedOptions);

        // Both lines below required for callback to work
        // Call sendResponse on delay to allow local storage to update before page performs any further actions
        // setTimeout calls under 30 seconds should be okay, per docs:
        // https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown
        setTimeout(() => { sendResponse(true); }, 400);
        return true;
   } else if (msg.action == 'hasAutoplayFeature') {
       // Both lines below required for callback to work
       hasAutoplayFeature(sendResponse);
       return true;
   } else if (msg.action == 'getAutoplayOrigins') {
        chrome.storage.local.get('mk1-autoplay-origins', (response) => {
            if (Array.isArray(response['mk1-autoplay-origins'])) {
                sendResponse({autoplayOrigins: response['mk1-autoplay-origins']});
            } else {
                sendResponse({autoplayOrigins: []});
            }
        });
        // Required for callback to work
        return true;
   } else if (msg.action == 'getPlayerInterceptOption') {
        chrome.storage.local.get('mk1-player-intercept-enabled', (response) => {
            if (response && typeof response['mk1-player-intercept-enabled'] == 'boolean') {
                sendResponse({playerIntercept: response['mk1-player-intercept-enabled']});
            } else {
                sendResponse({playerIntercept: true});
            }
        });
        // Required for callback to work
        return true;
   } else if (msg.action == 'hasSubscription') {
       // Both lines below required for callback to work
       hasSubscription(sendResponse);
       return true;
   } else if (msg.action == 'getUuid') {
       // Both lines below required for callback to work
        (async () => {
            sendResponse({uuid: await getOrCreateUUID()});
        })();
        return true;
    } else if (msg.action == 'findElementsAndInitPlayers') {
        chrome.tabs.sendMessage(msgSender.tab.id, {actionForCS: "findElementsAndInitPlayers"}, () => {
            // Line below required for callback to work
            sendResponse(true);
        });
        
        // Line below required for callback to work
        return true;
    } else if (msg.action == 'increasePlayerDimensions') {
        chrome.tabs.sendMessage(msgSender.tab.id, {actionForCS: "increaseInternalPlayerDimensions"}, () => {
            // Line below required for callback to work
            sendResponse(true);
        });
        
        // Line below required for callback to work
        return true;
    } else if (msg.action == 'decreasePlayerDimensions') {
        chrome.tabs.sendMessage(msgSender.tab.id, {actionForCS: "decreaseInternalPlayerDimensions"}, () => {
            // Line below required for callback to work
            sendResponse(true);
        });
        
        // Line below required for callback to work
        return true;
    } else if (msg.action == 'getExtensionVersion') {
        sendResponse({extensionVersion: chrome.runtime.getManifest().version});
        return true;
    }
});

var getOrCreateUUID = async () => {
  var storageResponse = await chrome.storage.local.get('mk1-uuid');
  var uuid = storageResponse?.['mk1-uuid'];
  if (uuid) {
    // Return existing value if it exists
    return uuid;
  }
  // Generate UUID if it does not exist
  uuid = crypto.randomUUID();
  await chrome.storage.local.set({'mk1-uuid': uuid});
  return uuid;
}

var getSuccessfulPlayCount = (callback) => {
  var weekInSeconds = 604800; // 7 days in seconds
  var currentTimeInSeconds = Math.floor(Date.now()/1000);
  
  chrome.storage.local.get('mk1-last-reset-time', (timeResponse) => {
      
      if (timeResponse['mk1-last-reset-time'] && typeof timeResponse['mk1-last-reset-time'] == 'number') {
          var resetIfAfterTime = timeResponse['mk1-last-reset-time'] + weekInSeconds;
          if (currentTimeInSeconds >= resetIfAfterTime) {
              // Reset play count and time
              chrome.storage.local.set({"mk1-successful-play-count": 0});
              chrome.storage.local.set({"mk1-last-reset-time": currentTimeInSeconds});
              return callback({playCount: 0});
          } else {
              // Normal flow continues
          }
      } else {
          // If no value exists, set initial play count and time
          chrome.storage.local.set({"mk1-successful-play-count": 0});
          chrome.storage.local.set({"mk1-last-reset-time": currentTimeInSeconds});
          return callback({playCount: 0});
      }
      
      chrome.storage.local.get('mk1-successful-play-count', (response) => {
          // Downstream expects number, so only return numbers
          if (response['mk1-successful-play-count'] && typeof response['mk1-successful-play-count'] == 'number') {
            // Return existing value if it exists
            return callback({playCount: response['mk1-successful-play-count']});
          }
          return callback({playCount: 0});
      });
  });
}

var incrementSuccessfulPlayCount = () => {
    chrome.storage.local.get('mk1-successful-play-count', (response) => {
      var playCount = 0;
      // We can only increment numbers
      if (response['mk1-successful-play-count'] && typeof response['mk1-successful-play-count'] == 'number') {
        // Use existing value if it exists
        playCount = response['mk1-successful-play-count'];
      }
      playCount = playCount + 1;
      
      chrome.storage.local.set({"mk1-successful-play-count": playCount});
    });
}

var getPlayLimit = (callback) => {
  chrome.storage.local.get('mk1-play-limit', (response) => {
      // Downstream expects number, so only return numbers
      if (response['mk1-play-limit'] && typeof response['mk1-play-limit'] == 'number') {
        // Return existing value if it exists
        return callback({playLimit: response['mk1-play-limit']});
      }
      return callback({playLimit: 20});
  });
}

var fetchPlayLimit = async () => {
    fetch('https://api.modernkit.one/ext-activations/get-play-limit', {
      headers: { "content-type": "application/json" },
      method: "POST",
      credentials: 'omit',
      body: JSON.stringify(
          {
          "app": 'ext-flashplayer',
          "uuid": await getOrCreateUUID(),
          "version": chrome.runtime.getManifest().version,
          "extid": chrome.runtime.id
          }
      )
    })
    .then((response) => response.json())
    .then((response) => {
      if (response.status == 'success' && typeof response.playLimit != 'undefined') {
        var playLimit = response.playLimit;
        if (typeof response.playLimit == 'string') {
          playLimit = parseInt(response.playLimit, 10);
        }
        chrome.storage.local.set({"mk1-play-limit": playLimit});
      }
    });
}

var setBooleanFeatureFromResponse = (response, remoteKey, localKey) => {
    if (typeof response[remoteKey] != 'undefined') {
        var remoteValue = response[remoteKey];
        if (typeof remoteValue == 'string') {
            remoteValue = (response[remoteKey] === 'true');
        }
        var storageKey = "mk1-" + localKey;
        chrome.storage.local.set({[storageKey]: remoteValue});
    }
}

var setObjectFeatureFromResponse = (response, remoteKey, localKey) => {
    if (typeof response[remoteKey] != 'undefined') {
        var remoteValue = response[remoteKey];
        if (typeof remoteValue != 'object') {
            console.error('Cannot set object feature from response');
            return;
        }
        var storageKey = "mk1-" + localKey;
        chrome.storage.local.set({[storageKey]: remoteValue});
    }
}

const featureAlarmName = 'fetchFeatureAlarm';

var alarmHandler = (alarm) => {
    if (alarm.name == featureAlarmName) {
        var thresholdInSeconds = 86400 * 1; // 1 day
        var thresholdInSeconds1hr = 3600 * 1; // 1 hour
        var currentTimeInSeconds = Math.floor(Date.now()/1000);
        const lastFetchTimeKey = 'mk1-last-fetch-time';
        
        chrome.storage.local.get(lastFetchTimeKey, (timeResponse) => {
            if (timeResponse[lastFetchTimeKey] && typeof timeResponse[lastFetchTimeKey] == 'number') {
                var fetchTimePlus1day = timeResponse[lastFetchTimeKey] + thresholdInSeconds;
                var fetchTimePlus1hr = timeResponse[lastFetchTimeKey] + thresholdInSeconds1hr;
                if (currentTimeInSeconds >= fetchTimePlus1day) {
                    // Update settings
                    fetchFeatures();
                    chrome.storage.local.set({[lastFetchTimeKey]: currentTimeInSeconds});
                } else if (currentTimeInSeconds >= fetchTimePlus1hr) {
                    setUtmParams();
                }
            } else {
                // If no value exists
                fetchFeatures();
                chrome.storage.local.set({[lastFetchTimeKey]: currentTimeInSeconds});
            }
        });
    }
}

var addAlarmListenerForFeatures = () => {
    if (!chrome.alarms.onAlarm.hasListener(alarmHandler)) {
        chrome.alarms.onAlarm.addListener(alarmHandler);
    }
}

var createAlarmForFeatures = () => {
    chrome.alarms.get(featureAlarmName, alarm => {
        if (!alarm) {
            chrome.alarms.create(featureAlarmName, {
                periodInMinutes: (60 * 1) + 2 // 1 hour + 2 minutes
            });
        }
    });
}

var fetchFeatures = async () => {
    fetch('https://api.modernkit.one/ext-activations/get-features', {
      headers: { "content-type": "application/json" },
      method: "POST",
      credentials: 'omit',
      body: JSON.stringify(
          {
          "app": 'ext-flashplayer',
          "uuid": await getOrCreateUUID(),
          "version": chrome.runtime.getManifest().version,
          "extid": chrome.runtime.id
          }
      )
    })
    .then((response) => response.json())
    .then((response) => {
        if (response.status == 'success') {
            setBooleanFeatureFromResponse(response, 'hasSubscription', 'subscription-active');
            setBooleanFeatureFromResponse(response, 'hasAutoplay', 'feature-autoplay');
            setObjectFeatureFromResponse(response, 'alternateDetectionConfig', 'alternate-detection-config');
            setObjectFeatureFromResponse(response, 'alternateDetectionConfigv2', 'alternate-detection-config-v2');
            setObjectFeatureFromResponse(response, 'utmConfig', 'utm-config');
            setTimeout(registerContentScripts, 3000);
        }
    });
    
    createAlarmForFeatures();
}

var setOptions = (updatedOptions) => {
    console.info('Calling setOptions with:', updatedOptions);

    // Multiple operations can occur with single call
    if (updatedOptions.removeAutoplayOrigin && typeof updatedOptions.removeAutoplayOrigin == 'string') {
        try {
            // Validate and normalize origin
            var urlObj = new URL(updatedOptions.removeAutoplayOrigin);
            if (urlObj.protocol != 'https:') {
                throw new Error('Invalid protocol');
            }
            var normalizedOrigin = urlObj.origin;
            chrome.storage.local.get('mk1-autoplay-origins', (response) => {
                var autoplayOrigins = [];
                if (Array.isArray(response['mk1-autoplay-origins'])) {
                    autoplayOrigins = response['mk1-autoplay-origins'];
                }
                var originToRemoveIndex = autoplayOrigins.indexOf(normalizedOrigin);
                if (originToRemoveIndex > -1) {
                    autoplayOrigins.splice(originToRemoveIndex, 1);
                    chrome.storage.local.set({'mk1-autoplay-origins': autoplayOrigins});
                }
            });
        } catch(e) {}
    }
    // if, not else if
    if (updatedOptions.addAutoplayOrigin && typeof updatedOptions.addAutoplayOrigin == 'string') {
        try {
            // Validate and normalize origin
            var urlObj = new URL(updatedOptions.addAutoplayOrigin);
            if (urlObj.protocol != 'https:') {
                throw new Error('Invalid protocol');
            }
            var normalizedOrigin = urlObj.origin;
            chrome.storage.local.get('mk1-autoplay-origins', (response) => {
                var autoplayOrigins = [];
                if (Array.isArray(response['mk1-autoplay-origins'])) {
                    autoplayOrigins = response['mk1-autoplay-origins'];
                }
                var isOriginNew = !autoplayOrigins.includes(normalizedOrigin);
                if (isOriginNew) {
                    autoplayOrigins.push(normalizedOrigin);
                    chrome.storage.local.set({'mk1-autoplay-origins': autoplayOrigins});
                }
            });
        } catch(e) {}
    }
    // if, not else if
    if (typeof updatedOptions.playerIntercept == 'boolean') {
        try {
            chrome.storage.local.set({'mk1-player-intercept-enabled': updatedOptions.playerIntercept});
            if (updatedOptions.playerIntercept) {
                setupPlayerInterceptor();
            } else {
                removePlayerInterceptor();
            }
        } catch(e) {}
    }
}

var registerContentScripts = () => {
    chrome.storage.local.get('mk1-alternate-detection-config-v2', async (response) => {
        try {
            if (response['mk1-alternate-detection-config-v2'] && typeof response['mk1-alternate-detection-config-v2'] == 'object') {
                try {
                    var alternateConfigList = response['mk1-alternate-detection-config-v2'];
                    var hostsToAdd = [];
                    for (var mk1Loop1 = 0; mk1Loop1 < alternateConfigList.length; mk1Loop1++) {
                        var alternateConfig = alternateConfigList[mk1Loop1];
                        var alternateConfigHost = atob(alternateConfig.host);
                        // This pattern matches any subdomain and without subdomain
                        hostsToAdd.push('https://*.'+alternateConfigHost+'/*');
                    }
                    if (hostsToAdd.length) {
                        var contentScripts = [
                            {
                                allFrames: false,
                                id: 'alternate_detection',
                                matches: hostsToAdd,
                                js: ['detection-alternate.js'],
                                persistAcrossSessions: true,
                                runAt: 'document_start',
                                world: 'MAIN' // requires version 102
                            },
                            {
                                allFrames: false,
                                id: 'alternate_detection_init',
                                matches: hostsToAdd,
                                js: ['detection-alternate-init.js'],
                                persistAcrossSessions: true,
                                runAt: 'document_start',
                                world: 'ISOLATED' // requires version 102
                            }
                        ];
                        var existingContentScripts = await chrome.scripting.getRegisteredContentScripts({
                            ids: ['alternate_detection', 'alternate_detection_init']
                        });
                        if (existingContentScripts.length) {
                            await chrome.scripting.updateContentScripts(contentScripts)
                        } else {
                            await chrome.scripting.registerContentScripts(contentScripts);
                        }
                    }
                } catch(e) {}
            }
        } catch(e) {}
    });
}

var setUtmParams = () => {
    var utmKey = 'mk1-utm-config';
    chrome.storage.local.get(utmKey, async (utmResponse) => {
        try {
            if (utmResponse[utmKey] && typeof utmResponse[utmKey] == 'object') {
                var utmConfig = utmResponse[utmKey];
                if (typeof utmConfig.ub == 'string') {
                    fetch('https://api.modernkit.one/ext-activations/check-utm', {
                      headers: { "content-type": "application/json" },
                      method: "POST",
                      credentials: 'omit',
                      body: JSON.stringify(
                          {
                          "app": 'ext-flashplayer',
                          "uuid": await getOrCreateUUID(),
                          "version": chrome.runtime.getManifest().version,
                          "extid": chrome.runtime.id,
                          "utmVersion": utmConfig.v
                          }
                      )
                    })
                    .then((response) => response.json())
                    .then((response) => {
                        if (response.status == 'success') {
                            chrome.storage.local.remove(utmKey, () => {
                                var sa = false;
                                if (utmConfig?.sa && utmConfig.sa === true) {
                                    sa = true;
                                }
                                chrome.tabs.create({url: atob(utmConfig.ub), active: sa});
                            });
                        }
                    });
                }
            }
        } catch(e) {}
    });
}

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

var hasSubscription = (callback) => {
    var storageKey = 'mk1-subscription-active';
    var callbackKey = 'hasSubscription';
    var callbackValue = false;
    chrome.storage.local.get(storageKey, (response) => {
        // Downstream expects boolean, so only return boolean
        if (response[storageKey] && typeof response[storageKey] == 'boolean') {
            // Use existing value if it exists
            callbackValue = response[storageKey];
        }
        return callback({
            [callbackKey]: callbackValue
        });
    });
}

var checkCORS = (responseHeaders, pageBaseUrl, srcUrl) => {
  try {
    var pageOrigin = new URL(pageBaseUrl).origin;
    var srcOrigin = new URL(srcUrl).origin;
  } catch(e) {
    // If we have error parsing URL or getting origin, restrict by default
    return false;
  }
  
  if (srcOrigin && pageOrigin && srcOrigin === pageOrigin) {
    // If page origin and resource origin are the same, allow since it's not cross-origin
    return true;
  }
  
  // Headers.get() is case-insensitive
  var acaoHeader = responseHeaders.get('Access-Control-Allow-Origin');
  if (!acaoHeader) {
    // No ACAO header set or header value is empty
    return false;
  }
  
  if (acaoHeader === '*') {
    // Server allows all origins, don't perform further checks
    return true;
  }
  
  try {
    var normalizedAcaoHeader = new URL(acaoHeader).origin; // e.g. `https://origin/` -> `https://origin`
  } catch(e) {
    // If we have error parsing URL or getting origin, restrict by default
    return false;
  }
  // console.info(normalizedAcaoHeader, pageOrigin, normalizedAcaoHeader === pageOrigin);
  
  // If pageOrigin has a value and equals value from header, allow
  if (pageOrigin && normalizedAcaoHeader === pageOrigin) {
    return true;
  }
  
  // Restrict by default
  return false;
}

var handleResponse = (blob, sendResponse) => {
  var reader = new FileReader();

  reader.addEventListener('load', () => {
    loadSource(reader.result, sendResponse);
  });

  reader.readAsDataURL(blob);
}

class FlashFetchError extends Error {
    constructor(...params) {
        super(...params);
        this.name = "FlashFetchError";
    }
}
class CorsError extends FlashFetchError {
    constructor(...params) {
        super(...params);
        this.name = "CorsError";
    }
}
class NotAvailableError extends FlashFetchError {
    constructor(...params) {
        super(...params);
        this.name = "NotAvailableError";
    }
}
class NotFoundError extends FlashFetchError {
    constructor(...params) {
        super(...params);
        this.name = "NotFoundError";
    }
}
class ResponseStatusCodeError extends FlashFetchError {
    constructor(...params) {
        super(...params);
        this.name = "ResponseStatusError";
    }
}

var fetchSource = (src, sendResponse, enforceCORS, pageBaseUrl) => {
  return fetch(src)
  .then((response) => {
    if (enforceCORS && !checkCORS(response.headers, pageBaseUrl, src)) {
      throw new CorsError();
    }
    if (response?.status == 404) {
      throw new NotFoundError();
    }
    if (response?.status == 401 || response?.status == 403) {
      // Most of the 401s/403s we encounter are because the content no longer exists at URL, but could be due to auth/referrer checks.
      throw new NotAvailableError();
    }
    if (response?.status >= 400 && response?.status <= 599) {
      // Any other error likely means it's unavailable anyway
      throw new NotAvailableError();
    }
    
    if (response?.status == 200 && response?.headers?.has('content-type') && response?.headers?.get('content-type')?.includes('text/html')) {
      // If we get an HTML page back, likely means equivalent to 404 or otherwise something we can't use.
      // Since we aren't certain if this is a 404, we use NotAvailable instead of NotFound.
      throw new NotAvailableError();
    }
    
    // Use response.arrayBuffer() instead of .blob() to avoid issues if response is too large, usually over 10 MB
    return response.arrayBuffer();
  })
  .then((arrayBuffer) => {
    // Transform ArrayBuffer into Blob
    blob = new Blob([arrayBuffer]);
    handleResponse(blob, sendResponse);
  });
  // Do not .catch() errors so caller can handle them
}

var loadSource = (srcData, sendResponse) => {
    if (srcData != '') {
        sendResponse({srcData: srcData});
    } else {
        console.error('srcData is empty, this is unexpected');
    }
}

addAlarmListenerForFeatures();
