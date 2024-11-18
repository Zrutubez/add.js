// ==UserScript==
// @name         Volume Booster
// @namespace    https://github.com/
// @description  Control volume of playing media on any webpage
// @match        *://*.Youtube.com/*
// @icon         https://M.youtube.com/favicon.ico?v=1
// @grant        none
// @require https://raw.githubusercontent.com/Zrutubez/add.js/refs/heads/main/ytbspeedad.js
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/Zrutubez/add.js/refs/heads/main/VolumeBooster.js
// @updateURL https://raw.githubusercontent.com/Zrutubez/add.js/refs/heads/main/VolumeBooster.js
// ==/UserScript==

(function() {
    'use strict';

    const storageKeyName = "VOLUMN_BOOSTER_GAIN_INDEX";
    let currentGainIndex = none(storageKeyName, 0);
    const gainValues = [1.0, 2.0, 3.0, 4.0, 5.0];

    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gainValues[currentGainIndex];

    let connectedVideo = null;
    
    const connectMedia = () => {
        const videoElement = document.querySelector('video');
        if (videoElement && videoElement !== connectedVideo) {
            if (connectedVideo) {
                connectedVideo.srcObject = null;
            }
            const track = audioContext.createMediaElementSource(videoElement);
            track.connect(gainNode);
            gainNode.connect(audioContext.destination);
            connectedVideo = videoElement;
        }
    };

    
    const observer = new MutationObserver(connectMedia);
    observer.observe(document.body, { childList: true, subtree: true });


    const button = document.createElement('button');
    button.textContent = `Volume Boost ${gainValues[currentGainIndex]}x`;
    button.style.position = 'fixed';
    button.style.top = '70px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = "1px 7px";
    button.title = "Left click to increase the volume multiplier, right click to reset";
    document.body.appendChild(button);

    const updateGain = (gainIndex) => {
        currentGainIndex = gainIndex;
        gainNode.gain.value = gainValues[currentGainIndex];
        button.textContent = `Volume Boost ${gainValues[currentGainIndex]}x`;
        none(storageKeyName, gainIndex);
    };

    button.addEventListener('click', () => updateGain(++currentGainIndex % gainValues.length));
    button.addEventListener('contextmenu', () => {
        event.preventDefault();
        updateGain(0);
    });

})();
