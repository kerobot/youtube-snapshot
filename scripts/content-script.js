// Wait for the YouTube player to load
window.addEventListener('load', function() {
    // Class to calculate frame rate
    class FrameRateCalculator {
        constructor() {
            this.lastFrameTime = performance.now();
            this.frameTimes = [];
            this.frameRate = 0;
            this.calculateFrameRate();
        }

        calculateFrameRate() {
            // ページの読み込みが始まってからの経過時間をミリ秒単位で取得
            const now = performance.now();
            // 前回のフレームからの経過時間（ミリ秒）を計算
            const delta = now - this.lastFrameTime;
            // 次のフレームの計算のため lastFrameTime を現在の時間に更新
            this.lastFrameTime = now;
            // delta を frameTimes 配列に追加（100件を超える場合は古いものから削除）
            this.frameTimes.push(delta);
            if (this.frameTimes.length > 100) {
                this.frameTimes.shift();
            }
            // reduce メソッドで配列の合計を計算し、配列の長さで割ることで平均経過時間（ミリ秒）を計算
            const averageDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            // 1000を平均経過時間で割ることでフレームレートを計算
            this.frameRate = 1000 / averageDelta;
            // 次のフレームの計算をスケジュール（calculateFrameRate メソッドを this コンテキストにバインド）
            requestAnimationFrame(this.calculateFrameRate.bind(this));
        }

        getFrameRate() {
            return this.frameRate;
        }
    }

    const frameRateCalculator = new FrameRateCalculator();

    // Function to handle button clicks
    function handleButtonClick(buttonClass) {
        const [action, value] = buttonClass.split(' ');

        switch (action) {
            case 'skiptime':
                skipTime(parseFloat(value));
                break;
            case 'skipframe':
                skipFrame(parseInt(value));
                break;
            case 'screenshot':
                takeScreenshot();
                break;
            default:
                alert('Unknown action');
        }
    }

    // Function to skip time in the video
    function skipTime(seconds) {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime += seconds;
        }
    }

    // Function to skip frames in the video
    function skipFrame(frames) {
        const video = document.querySelector('video');
        if (video) {
            const frameRate = frameRateCalculator.getFrameRate();
            const seconds = frames / frameRate;
            video.currentTime += seconds;
        }
    }

    // Function to take a screenshot of the video
    function takeScreenshot() {
        const video = document.querySelector('video');
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'screenshot.png';
            link.click();
        }
    }

    // Function to create and add buttons
    function addButtons() {
        // Check if the buttons already exist
        if (document.getElementById('custom-buttons-container')) return;

        // Create a container for the buttons
        const container = document.createElement('div');
        container.id = 'custom-buttons-container';
        container.style.position = 'absolute';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.zIndex = '1000';
        container.style.display = 'flex';
        container.style.gap = '5px';

        // Button configurations
        const buttons = [
            { label: '<<', class: 'skiptime -1' },
            { label: '<', class: 'skiptime -0.1' },
            { label: '<f', class: 'skipframe -1' },
            { label: 'f>', class: 'skipframe 1' },
            { label: '>', class: 'skiptime 0.1' },
            { label: '>>', class: 'skiptime 1' },
            { label: '📷', class: 'screenshot' }
        ];

        // Create and style each button
        buttons.forEach(buttonConfig => {
            const button = document.createElement('button');
            button.innerText = buttonConfig.label;
            button.className = buttonConfig.class;
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.padding = '5px';
            button.style.width = '30px';
            button.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
            button.style.color = '#ffffff';
            button.style.border = 'none';
            button.style.cursor = 'pointer';
            button.style.fontSize = '14px';
            button.style.borderRadius = '3px';
            button.addEventListener('click', () => handleButtonClick(button.className));
            container.appendChild(button);
        });

        // Append the container to the YouTube player
        const player = document.querySelector('.html5-video-player');
        if (player) {
            player.appendChild(container);
        }
    }

    let frameRateInterval;

    // Add buttons when the player is ready
    const observer = new MutationObserver(() => {
        addButtons();
        // ボタンが追加された後に showFPS の設定を読み込む
        chrome.storage.sync.get(['showFPS'], function (result) {
            if (chrome.runtime.lastError) {
                console.error('Error retrieving showFPS setting:', chrome.runtime.lastError);
                return;
            }
            if (result.showFPS) {
                if (!document.getElementById('frame-rate-display')) {
                    createFrameRateDisplay();
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function createFrameRateDisplay() {
        const frameRateDisplay = document.createElement('div');
        frameRateDisplay.id = 'frame-rate-display';
        frameRateDisplay.style.padding = '5px';
        frameRateDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        frameRateDisplay.style.color = '#ffffff';
        frameRateDisplay.style.fontSize = '14px';
        frameRateDisplay.style.borderRadius = '3px';
        frameRateDisplay.innerText = '0FPS';
    
        const container = document.getElementById('custom-buttons-container');
        if (container) {
            container.insertBefore(frameRateDisplay, container.firstChild);
        }
    
        // Update frame rate display every second
        frameRateInterval = setInterval(() => {
            const frameRate = frameRateCalculator.getFrameRate().toFixed(2);
            frameRateDisplay.innerText = `${frameRate}FPS`;
        }, 1000);
    }
    
    function removeFrameRateDisplay() {
        const frameRateDisplay = document.getElementById('frame-rate-display');
        if (frameRateDisplay) {
            frameRateDisplay.remove();
            clearInterval(frameRateInterval);
        }
    }
      
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (changes.showFPS) {
            if (changes.showFPS.newValue) {
                createFrameRateDisplay();
            } else {
                removeFrameRateDisplay();
            }
        }
    });
});
