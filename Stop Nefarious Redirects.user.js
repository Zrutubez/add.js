// ==UserScript==
// @name         Stop Nefarious Redirects
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Block unauthorized redirects and prevent history manipulation
// @match        http://*/*
// @match        https://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @license      MIT
// @run-at       document-start
// @downloadURL https://raw.githubusercontent.com/Zrutubez/add.js/refs/heads/main/Stop Nefarious Redirects.user.js
// @updateURL https://raw.githubusercontent.com/Zrutubez/add.js/refs/heads/main/Stop Nefarious Redirects.user.js
// ==/UserScript==

const manualBlacklist = new Set([
    'getrunkhomuto.info',
'm.youtube.com/api/stats/watchtime',
'www.youtube.com/pagead/interaction/',
'www.youtube.com/pcs/activeview',
'www.youtube.com/pagead/adview',
'm.youtube.com/api/stats/ads',
'play.google.com/',
'm.youtube.com/youtubei/v1/log_event?alt=json
'www.youtube.com/pagead/',
'm.youtube.com/ptracking',
'm.youtube.com/api/stats/playback',
'tpc.googlesyndication.com/simgad/',
'm.youtube.com/s/player/*/ad.js
'www.youtube.com/pagead/paralleladview',
'm.youtube.com/generate_204',
'm.youtube.com/api/stats/qoe',
'pagead2.googlesyndication.com/pcs/activeview',
'www.google.com/pagead/',
'googleads.g.doubleclick.net/pagead/adview'
]);

// List of allowed popups domains (user should add specific domains here as needed)
const allowedSites = new Set([
    'github.com', '',
    ''
]);

const logPrefix = '[Nefarious Redirect Blocker]';

(function() {
    'use strict';

    console.log(`${logPrefix} Script initialization started.`);

    function getAutomatedBlacklist() {
        return new Set(GM_getValue('blacklist', []));
    }

    function addToAutomatedBlacklist(url) {
        const encodedUrl = encodeURIComponent(url);
        const blacklist = getAutomatedBlacklist();
        if (!blacklist.has(encodedUrl)) {
            blacklist.add(encodedUrl);
            GM_setValue('blacklist', Array.from(blacklist));
            console.log(`${logPrefix} Added to automated blacklist:`, url);
        }
    }

    function isNavigationAllowed(url) {
        if (!isUrlBlocked(url)) {
            console.log(`${logPrefix} Navigation allowed to:`, url);
            lastKnownGoodUrl = url;
            return true;
        } else {
            console.error(`${logPrefix} Blocked navigation to:`, url);
            addToAutomatedBlacklist(url);
            if (lastKnownGoodUrl) {
                window.location.replace(lastKnownGoodUrl);
            }
            return false;
        }
    }

    const originalOpen = window.open;

    console.log(`${logPrefix} Original window.open saved.`);

    window.open = function(url, name, features) {
        console.log(`${logPrefix} Popup attempt detected:`, url);
        if (Array.from(allowedSites).some(domain => url.includes(domain)) || isNavigationAllowed(url)) {
            console.log(`${logPrefix} Popup allowed for:`, url);
            return originalOpen(url, name, features);
        }
        console.log(`${logPrefix} Blocked a popup from:`, url);
        return null;
    };

    console.log(`${logPrefix} window.open overridden with custom logic.`);

    let lastKnownGoodUrl = window.location.href;

    function interceptNavigation(event) {
        const url = event.detail.url;
        if (!isNavigationAllowed(url)) {
            event.preventDefault();
            return false;
        }
        return true;
    }

    window.addEventListener('beforeunload', function(event) {
        if (!isNavigationAllowed(window.location.href)) {
            event.preventDefault();
            event.returnValue = '';
            return false;
        }
    });

    window.addEventListener('popstate', function(event) {
        if (!isNavigationAllowed(window.location.href)) {
            console.error(`${logPrefix} Blocked navigation to:`, window.location.href);
            history.pushState(null, "", lastKnownGoodUrl);
            window.location.replace(lastKnownGoodUrl);
            event.preventDefault();
        }
    });

    function handleHistoryManipulation(originalMethod, data, title, url) {
        if (!isUrlBlocked(url)) {
            return originalMethod.call(history, data, title, url);
        }
        console.error(`${logPrefix} Blocked history manipulation to:`, url);
    }

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(data, title, url) {
        return handleHistoryManipulation(originalPushState, data, title, url);
    };

    history.replaceState = function(data, title, url) {
        return handleHistoryManipulation(originalReplaceState, data, title, url);
    };

    function isUrlBlocked(url) {
        const encodedUrl = encodeURIComponent(url);
        const automatedBlacklist = getAutomatedBlacklist();
        const isBlocked = [...manualBlacklist, ...automatedBlacklist].some(blockedUrl => encodedUrl.includes(blockedUrl));
        if (isBlocked) {
            console.log(`${logPrefix} Blocked URL:`, url);
        }
        return isBlocked;
    }

    console.log(`${logPrefix} Redirect control script with blacklist initialized.`);
})();
