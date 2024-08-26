document.addEventListener('DOMContentLoaded', function () {
    const fpsToggle = document.getElementById('fpsToggle');

    chrome.storage.sync.get(['showFPS'], function (result) {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving showFPS setting:', chrome.runtime.lastError);
            return;
        }
        fpsToggle.checked = result.showFPS || false;
    });

    fpsToggle.addEventListener('change', function () {
        chrome.storage.sync.set({ showFPS: fpsToggle.checked }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error saving showFPS setting:', chrome.runtime.lastError);
            }
        });
    });
});
