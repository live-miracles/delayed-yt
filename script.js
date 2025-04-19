const YT_BASE_URL = 'https://www.youtube.com/embed/';

const SKIP_MARGIN = 600;
const START_MARGIN = 30;
const SKIP_CORRECTION = 5;
const STREAM_DURATION_CORRECTION = 3600;

const DEFAULT_VIDEO_ID = 'jfKfPfyJRdk';
const DEFAULT_DELAY = 900;
const MINIMAL_DELAY = 660;

const player = {
    ytPlayer: null,
    isReady: false,
    startingDuration: -100,
    startingDate: -100,
    videoId: '',
    statusTitle: '',
    connection: null,
    startingDelay: -100,
    savedDelay: -100,
};

function getVideoId() {
    return document.getElementById('video-id').value;
}

function getStatusTitle() {
    return document.getElementById('status-title').value;
}

function getStatusServer() {
    return document.getElementById('status-server').value;
}

function getDelay() {
    const delayH = parseInt(document.getElementById('delay-hour').value);
    const delayM = parseInt(document.getElementById('delay-min').value);
    const delayS = parseInt(document.getElementById('delay-sec').value);
    const delay = delayH * 3600 + delayM * 60 + delayS;
    console.assert(delay >= MINIMAL_DELAY);
    if (delay < MINIMAL_DELAY) {
        console.error(`Delay shouldn't be less than ${MINIMAL_DELAY}s`);
        return MINIMAL_DELAY;
    }
    return delay;
}

function updatePlayerData() {
    player.videoId = getVideoId();
    player.statusServer = getStatusServer();
    player.statusTitle = getStatusTitle();
    player.startingDelay = getDelay();
    // We need to negate SKIP_CORRECTION to the saved delay because when the player loads
    // the script will think it got skipped to live, and apply the SKIP_CORRECTION
    player.savedDelay = getDelay() - SKIP_CORRECTION;
}
function loadPlayer() {
    updatePlayerData();
    const playerElem = document.getElementById('player');
    playerElem.src = `${YT_BASE_URL}${player.videoId}?autoplay=1&enablejsapi=1&iv_load_policy=3`;
}

async function loadNewVideo() {
    updatePlayerData();
    if (player.connection) player.connection.close();
    player.connection = getNewBroadcastChannel();

    await player.ytPlayer.loadVideoById({ videoId: player.videoId });
}

function loadPlayerAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
    player.ytPlayer = new YT.Player('player', {
        events: {
            onReady: loadNewVideo,
            onStateChange: onPlayerStateChange,
        },
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        const duration = player.ytPlayer.getDuration() - STREAM_DURATION_CORRECTION;
        // if duration is the same as current one, it means
        // that player wasn't reloaded, so we don't need to update timings
        if (Math.abs(duration - player.startingDuration) > 10) {
            player.startingDate = getCurrentDate();
            player.startingDuration = duration;
            console.log('Player started. Duration:', player.startingDuration);
            loadNewVideo();
        }
        player.isReady = true;
    }
}

function getActualDuration() {
    if (player.startingDuration <= 0) {
        console.error('Invalid duration:', player.startingDuration);
        return 0;
    }
    if (player.startingDate <= 0) {
        console.error('Invalid time:', player.startingDate);
        return 0;
    }
    const ans = player.startingDuration + (getCurrentDate() - player.startingDate);

    if (ans <= 0) {
        console.error('Invalid actual duration:', ans);
        return 0;
    }
    return ans;
}

function seekDelay(delay) {
    if (isNaN(delay)) {
        console.error('Delay should be a positive number, but it is: ' + delay);
        return;
    }
    console.assert(delay >= MINIMAL_DELAY);
    const newTime = getActualDuration() - delay;
    console.log('Seeking to a new delay: ' + delay + ', at time:' + newTime);
    player.ytPlayer.seekTo(newTime);
    player.isReady = false;
}

function updateDelay() {
    const newDelayElem = document.getElementById('new-delay');
    let newDelay = parseInt(newDelayElem.value);
    console.log(newDelay);
    if (newDelay < MINIMAL_DELAY) newDelay = MINIMAL_DELAY;
    seekDelay(newDelay);
}

function adjustDelay(val) {
    const currentDelay = getActualDuration() - player.ytPlayer.getCurrentTime();
    let newDelay = currentDelay + val;
    if (newDelay < MINIMAL_DELAY) newDelay = MINIMAL_DELAY;
    seekDelay(newDelay);
}

function renderStats(duration, delay) {
    const durationElem = document.getElementById('duration-stat');
    const delayElem = document.getElementById('delay-stat');
    const delayInfo = document.getElementById('delay-info');

    if (duration === null || delay === null) {
        durationElem.innerHTML = '...';
        delayElem.innerHTML = '...';
        delayInfo.innerHTML = '...';
        return;
    }
    durationElem.innerHTML = durationToString(duration);
    delayElem.innerHTML = durationToString(delay);
    delayInfo.innerHTML = durationToString(delay);
}

function getNewBroadcastChannel() {
    const bc = new BroadcastChannel(player.videoId);
    bc.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'NEW_DELAY') {
            const newDelayElem = document.getElementById('new-delay');
            newDelayElem.value = msg.value;
            updateDelay();
        }
        if (msg.type === 'ADJUST_DELAY') {
            adjustDelay(msg.value);
        }
    };
    return bc;
}

function sendStatusUpdate() {
    const statusServer = player.statusServer;
    if (!statusServer) {
        return;
    }
    const id = player.videoId;
    const title = player.statusTitle;
    const delay = Math.floor(player.savedDelay);
    const duration = Math.floor(getActualDuration());

    fetch(statusServer, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, title, delay, duration }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to send status');
            }
            return response.json();
        })
        .then((data) => {
            if (data.seekDelay !== undefined) {
                seekDelay(data.seekDelay);
            }
        })
        .catch((error) => {
            console.error('Error sending status:', error);
        });
}

(() => {
    setInputElements();
    document
        .querySelectorAll('.url-param')
        .forEach((elem) => elem.addEventListener('change', updateUrlParams));

    player.connection = getNewBroadcastChannel();

    loadPlayer();
    loadPlayerAPI();

    document.getElementById('video-id').onpaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        e.target.value = extractYouTubeId(paste);
    };

    document.addEventListener('keydown', function (event) {
        if (event.key === 'd' || event.key === 'D') {
            const delayDiv = document.getElementById('delay-info');
            delayDiv.classList.remove('hidden');
            setTimeout(() => {
                delayDiv.classList.add('hidden');
            }, 2000);
        }
    });

    setInterval(() => {
        // First 30min after stream started player.getDuration() will always return 3600
        if (!player.isReady || player.startingDuration === 0) {
            renderStats(null, null);
            return;
        }

        console.assert(player.videoId, !isNaN(player.savedDelay));
        const actualDuration = getActualDuration();
        const currentTime = player.ytPlayer.getCurrentTime();
        console.assert(!isNaN(actualDuration));

        // It shouldn't happen when player is ready, but just in case
        if (isNaN(currentTime)) {
            renderStats(null, null);
            return;
        }
        // If stream started recently and didn't reach starting delay yet
        if (actualDuration < player.startingDelay) {
            return;
        }
        // When player loads it will be at 0 for a few seconds, and only then it goes to live
        // We just want to give it time to adjust itself properly before we interact with it
        if (currentTime < START_MARGIN) {
            return;
        }

        const currentDelay = actualDuration - currentTime;
        console.assert(currentDelay > -10, 'Invalid current delay: ' + currentDelay);

        renderStats(actualDuration, currentDelay);
        player.connection.postMessage(
            JSON.stringify({ type: 'STATS', duration: actualDuration, delay: currentDelay }),
        );

        if (currentDelay >= MINIMAL_DELAY) {
            if (Math.abs(player.savedDelay - currentDelay) < 2) {
                return;
            }
            player.savedDelay = currentDelay;
            console.log('New saved delay:', currentDelay);
        } else if (currentDelay > SKIP_MARGIN) {
            if (Math.abs(player.savedDelay - MINIMAL_DELAY) < 2) {
                return;
            }
            player.savedDelay = MINIMAL_DELAY;
            console.log('New saved delay:', MINIMAL_DELAY);
        } else {
            const newDelay = Math.max(player.savedDelay + SKIP_CORRECTION, player.startingDelay);
            console.log(
                `Current delay was: ${currentDelay}, saved delay: ${player.savedDelay}, seeking delay: ${newDelay}`,
            );
            seekDelay(newDelay);
        }
    }, 1000);

    setInterval(sendStatusUpdate, 1000);
})();
