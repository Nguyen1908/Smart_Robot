/***
Alternate Flash detection logic used for specific websites.
Must run in page context.
***/
if (document.contentType == 'text/html' || document.contentType == 'application/xhtml+xml') { // Only run in HTML documents
  var mk1StartAlternateDetection = (alternateConfig, extId) => {
        var mk1ExtId = extId;
        var mk1PageBridgeElem;
        try {
            var mk1AlternateConfig = alternateConfig;
        } catch(e) {};
        if (typeof mk1AlternateConfig != 'object' || typeof mk1ExtId != 'string') {
            return;
        }

        var mk1ProcessDetectedSrcs = (detectedSrcsKeyed) => {
            try {
                mk1PageBridgeElem.contentWindow.postMessage({action: "processDetectedSrcsv2", detectedSrcsKeyed: detectedSrcsKeyed, detectionVersion: mk1AlternateConfig.detectionVersion}, '*');
            } catch(e) {}
        }
        var mk1OriginalXHROpen = window.XMLHttpRequest.prototype.open;
        var mk1CheckPath = atob(mk1AlternateConfig.path);
        var mk1CheckBody = atob(mk1AlternateConfig.body);
        var mk1NewLine = atob('Cg==');
        var mk1Iter = 'X19pdGVyX18=';
        var mk1GetNested = (obj, ...props) => {
            try {
                for (var encProp of props) {
                    prop = atob(encProp);
                    if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
                        return false;
                    }
                    obj = obj[prop];
                }
                return obj;
            } catch(e) {
                return false;
            }
        }
        var mk1CleanupDetectedSrcs = (detectedSrcsKeyed) => {
            if (typeof mk1AlternateConfig.excludeKeys != 'object') {
                return false;
            }
            if (detectedSrcsKeyed.length == 0) { return false; }
            var cleanupInternal = (obj, previousPropName, prevObj) => {
                if (typeof obj != 'object') { return; }
                try {
                    for (prop in obj) {
                        var typeOfProp = typeof obj[prop];
                        var shouldDeleteProp = false;
                        
                        if (obj[prop] === null
                            || typeOfProp == 'boolean'
                            || (typeOfProp == 'object' && Object.entries(obj[prop]).length == 0)
                        ) {
                            shouldDeleteProp = true;
                        } else {
                            mk1AlternateConfig.excludeKeys.forEach((excludeKey) => {
                                if (shouldDeleteProp) { return; }
                                var excludeKeyName = atob(excludeKey.k);
                                if (excludeKey.t == 'e') {
                                    if (prop == excludeKeyName) {
                                        shouldDeleteProp = true;
                                    }
                                } else if (excludeKey.t == 's') {
                                    if (prop.slice(0, excludeKeyName.length) == excludeKeyName) {
                                        shouldDeleteProp = true;
                                    }
                                } else if (excludeKey.t == 'i') {
                                    if (prop.indexOf(excludeKeyName) > -1) {
                                        shouldDeleteProp = true;
                                    }
                                } else if (excludeKey.t == 'l') {
                                    if (typeOfProp == 'string' && prop == excludeKeyName && obj[prop].length > 50) {
                                        shouldDeleteProp = true;
                                    }
                                }
                                
                            });
                        }
                        
                        if (shouldDeleteProp) {
                            delete obj[prop];
                            if (typeof prevObj == 'object'
                                && typeof prevObj[previousPropName] == 'object'
                                && Object.entries(prevObj[previousPropName]).length === 0
                            ) {
                                delete prevObj[previousPropName];
                            }
                        } else if (typeOfProp === 'object') {
                            cleanupInternal(obj[prop], prop, obj);
                        }
                    }
                } catch(e) {}
            }
            for (detectedSrcKeyed of detectedSrcsKeyed) {
                try {
                    if (typeof detectedSrcKeyed.detectedSrc == 'object') {
                        cleanupInternal(detectedSrcKeyed.detectedSrc);
                    }
                } catch(e) {
                    return false;
                }
            }
            return true;
        }
        var pageBridgeInitiated = false;
        var initPageBridge = async () => {
            try {
                if (pageBridgeInitiated) { return; }
                pageBridgeInitiated = true;
                mk1PageBridgeElem = document.createElement('iframe');
                mk1PageBridgeElem.id = 'mk1PageBridge';
                mk1PageBridgeElem.style = 'width:0;height:0;opacity:0;';
                mk1PageBridgeElem.src = 'chrome-extension://'+mk1ExtId+'/external/page-bridge.html';
                document.body.appendChild(mk1PageBridgeElem);
            } catch(e) {}
        };
        var mk1DetectSrcsFromDetectedObj = (detectedObj) => {
            try {
                if (typeof detectedObj !== 'undefined') {
                    var detectedSrcsKeyed = [];
                    mk1AlternateConfig.flashObjKeys.forEach((flashObjKey, index) => {
                        var detectedSrc = mk1GetNested(detectedObj, ...flashObjKey);
                        if (detectedSrc !== null && detectedSrc !== false) {
                            detectedSrcsKeyed.push({flashObjKeyIndex: index, detectedSrc: detectedSrc});
                        }
                    });
                    var success = mk1CleanupDetectedSrcs(detectedSrcsKeyed);
                    if (success) {
                        mk1ProcessDetectedSrcs(detectedSrcsKeyed);
                    }
                }
            } catch(e) {}
        }
        window.XMLHttpRequest.prototype.open = function (method, url, isAsync) {
            try {
                if (url.indexOf(mk1CheckPath) > -1) {
                    initPageBridge(); // async
                    this.addEventListener('load', () => {
                        try {
                            if (this.responseText.indexOf(mk1CheckBody) > -1) {
                                var lines = this.responseText.split(mk1NewLine);
                                lines.forEach((line) => {
                                    if (line.indexOf(mk1CheckBody) > -1) {
                                        try {
                                            var parsedObj = JSON.parse(line);
                                            var detectedObjs = [];
                                            mk1AlternateConfig.tryKeys.forEach((tryKeySet) => {
                                                var mk1IterIndex = tryKeySet.indexOf(mk1Iter);
                                                var possibleDetectedObj;
                                                var possibleIterObj;
                                                if (mk1IterIndex > -1) {
                                                    var iterKeySet = tryKeySet.slice(0, mk1IterIndex);
                                                    var iterEndKeySet = tryKeySet.slice(mk1IterIndex + 1);
                                                    possibleIterObj = mk1GetNested(parsedObj, ...iterKeySet);
                                                    if (possibleIterObj !== null && possibleIterObj !== false) {
                                                        possibleIterObj.forEach((iterObj) => {
                                                            if (iterEndKeySet.length === 0) {
                                                                possibleDetectedObj = iterObj;
                                                            } else {
                                                                possibleDetectedObj = mk1GetNested(iterObj, ...iterEndKeySet);
                                                            }
                                                            if (possibleDetectedObj !== null && possibleDetectedObj !== false) {
                                                                detectedObjs.push(possibleDetectedObj);
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    possibleDetectedObj = mk1GetNested(parsedObj, ...tryKeySet);
                                                    if (possibleDetectedObj !== null && possibleDetectedObj !== false) {
                                                        detectedObjs.push(possibleDetectedObj);
                                                    }
                                                }
                                            });
                                            if (detectedObjs.length > 0) {
                                                detectedObjs.forEach(detectedObj => {
                                                    mk1DetectSrcsFromDetectedObj(detectedObj);
                                                });
                                            }
                                        } catch(e) {}
                                    }
                                });
                            }
                        } catch(e) {}
                    });
                }
            } catch(e) {}
            return mk1OriginalXHROpen.apply(this, arguments);
        }
        var secondaryAlternateDetection = () => {
            try {
                var findSrcs = (theObject, propArr) => {
                    try {
                        var result;
                        if (theObject instanceof Array) {
                            for (var i = 0; i < theObject.length; i++) {
                                result = findSrcs(theObject[i], propArr);
                                if (result) {
                                    break;
                                }   
                            }
                        } else {
                            for (var prop in theObject) {
                                if (prop == propArr[0] && theObject[propArr[0]] instanceof Object && theObject[propArr[0]][propArr[1]]) {
                                    return theObject[prop];
                                }
                                if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
                                    result = findSrcs(theObject[prop], propArr);
                                    if (result) {
                                        break;
                                    }
                                } 
                            }
                        }
                        return result;
                    } catch(e) {}
                }
                
                var secondaryTryKeys = [];
                mk1AlternateConfig.secondary.tryKeys.forEach(key => {
                    secondaryTryKeys.push(atob(key));
                });
                
                var selectedElems = document.querySelectorAll(atob(mk1AlternateConfig.secondary.selector));
                for (elem of selectedElems) {
                    if (elem.innerText.indexOf(mk1CheckBody) > -1) {
                        var parsedElem = JSON.parse(elem.innerText);
                        var detectedObj = findSrcs(parsedElem, secondaryTryKeys);
                        mk1DetectSrcsFromDetectedObj(detectedObj);
                    }
                }
            } catch(e) {}
        }
        
        setTimeout(initPageBridge, 5000);
        setTimeout(secondaryAlternateDetection, 10000);
    }
} // Only run in HTML documents
