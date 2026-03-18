const YT_BASE_URL = 'https://www.youtube.com/embed/';

const MINIMAL_DELAY = 600;
const SKIP_MARGIN = 500;
const START_MARGIN = 30;
const SKIP_CORRECTION = 5;
const STREAM_DURATION_CORRECTION = 3600;
const DELAY_DIFF_MARGIN = 60;

const DEFAULT_VIDEO_ID = 'jfKfPfyJRdk';

// ===== YouTube Player API =====
function loadPlayer() {
    updatePlayerData();
    const playerElem = document.getElementById('player');
    playerElem.src = `${YT_BASE_URL}${player.videoId}?autoplay=1&enablejsapi=1&iv_load_policy=3`;
}

async function loadNewVideo() {
    updatePlayerData();
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
        }
        player.isReady = true;
    }
}

// ===== Player Logic =====
function updatePlayerData() {
    player.isReady = false;
    player.videoId = getVideoId();
    player.startingDelay = getDelay();
    player.allowDelayChange = getAllowDelayChange();
    // We need to negate SKIP_CORRECTION to the saved delay because when the player loads
    // the script will think it got skipped to live, and apply the SKIP_CORRECTION
    player.savedDelay = getDelay() - SKIP_CORRECTION;
}

function getActualDuration(player) {
    if (player.startingDuration < 0) {
        console.error('Invalid duration:', player.startingDuration);
        return 0;
    }

    if (player.startingDuration === 0) return 0;

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
    const newTime = getActualDuration(player) - delay;
    console.log('Seeking to a new delay: ' + delay + ', at time: ' + newTime);
    player.isReady = false;
    player.ytPlayer.seekTo(newTime);
}

function adjustDelay(val) {
    const currentDelay = getActualDuration(player) - player.ytPlayer.getCurrentTime();
    let newDelay = currentDelay + val;
    if (newDelay < MINIMAL_DELAY) newDelay = MINIMAL_DELAY;
    seekDelay(newDelay);
}

// ===== User Inputs ====
function getVideoId() {
    return document.getElementById('v').value;
}

function getDelay() {
    const delayH = parseInt(document.getElementById('h').value);
    const delayM = parseInt(document.getElementById('m').value);
    const delayS = parseInt(document.getElementById('s').value);
    const delay = delayH * 3600 + delayM * 60 + delayS;
    console.assert(delay >= MINIMAL_DELAY);
    if (delay < MINIMAL_DELAY) {
        console.error(`Delay shouldn't be less than ${MINIMAL_DELAY}s`);
        return MINIMAL_DELAY;
    }
    return delay;
}

function getAllowDelayChange() {
    return document.getElementById('c').checked;
}

function getShowDelay() {
    return document.getElementById('d').checked;
}

function toggleShowDelay() {
    document.getElementById('d').checked = !getShowDelay();

    const delayInfo = document.getElementById('delay-info');
    if (getShowDelay()) {
        delayInfo.classList.add('opacity-30');
        delayInfo.classList.remove('opacity-0');
    } else {
        delayInfo.classList.add('opacity-0');
        delayInfo.classList.remove('opacity-30');
    }
}

// ===== Rendering =====
function renderStats(duration, delay) {
    const durationElem = document.getElementById('duration-stat');
    const delayElem = document.getElementById('delay-stat');
    const delayInfo = document.getElementById('delay-info');

    if (duration === null || delay === null) {
        durationElem.innerHTML = '???';
        delayElem.innerHTML = '???';
        delayInfo.innerHTML = '???';
        return;
    }
    durationElem.innerHTML = durationToString(duration);
    delayElem.innerHTML = durationToString(delay);
    delayInfo.innerHTML = durationToString(delay);
}

// =====
// ===== Execution =====
// =====

const player = {
    ytPlayer: null,
    isReady: false,
    startingDuration: -100,
    startingDate: -100,
    videoId: '',
    startingDelay: -100,
    savedDelay: -100,
    allowDelayChange: false,
};

(() => {
    setDocumentUrlParams();
    document
        .querySelectorAll('.url-param')
        .forEach((elem) => elem.addEventListener('change', updateUrlParam));

    loadPlayer();
    loadPlayerAPI();

    document.getElementById('v').onpaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        e.target.value = extractYouTubeId(paste);
        updateUrlParam(e);
    };

    const alertElem = document.querySelector('.alert');
    document.getElementById('delay-info').addEventListener('click', toggleShowDelay);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'd' || event.key === 'D') toggleShowDelay();
    });

    setInterval(() => {
        if (!player.isReady) {
            console.log(new Date().toLocaleTimeString() + ' | Player not ready');
            renderStats(null, null);
            return;
        }

        // If duration is 0 it means stream started less than 30 min ago.
        if (player.startingDuration === 0) {
            if (getCurrentDate() - player.startingDate > 5 * 60) {
                location.reload();
            }
            alertElem.classList.remove('hidden');
            renderStats(null, null);
            return;
        }

        console.assert(player.videoId && !isNaN(player.savedDelay));
        const currentTime = player.ytPlayer.getCurrentTime();
        const timestamp = new Date().toLocaleTimeString();

        const actualDuration = getActualDuration(player);
        if (isNaN(actualDuration)) {
            console.error(timestamp + ' | Invalid actualDuration: ' + actualDuration);
            renderStats(null, null);
            return;
        }

        // It shouldn't happen when player is ready, but just in case
        if (isNaN(currentTime)) {
            console.error(timestamp + ' | Invalid currentTime: ' + currentTime);
            renderStats(null, null);
            return;
        }

        const currentDelay = actualDuration - currentTime;
        console.assert(currentDelay > -10, 'Invalid current delay: ' + currentDelay);

        renderStats(actualDuration, currentDelay);

        // If stream started recently and didn't reach starting delay yet
        if (actualDuration < player.startingDelay) {
            return;
        }
        // When player loads it will be at 0 for a few seconds, and only then it goes to live
        // We just want to give it time to adjust itself properly before we interact with it
        if (currentTime < START_MARGIN) {
            return;
        }

        if (
            !player.allowDelayChange &&
            Math.abs(currentDelay - player.startingDelay) > DELAY_DIFF_MARGIN
        ) {
            let newDelay = player.savedDelay + SKIP_CORRECTION;
            if (Math.abs(newDelay - player.startingDelay) > DELAY_DIFF_MARGIN)
                newDelay = player.startingDelay;
            console.log(
                timestamp +
                    ` | Current delay was: ${currentDelay}, saved: ${player.savedDelay}, seeking: ${newDelay}`,
            );
            seekDelay(newDelay);
        } else if (currentDelay >= MINIMAL_DELAY) {
            // If current delay is more then MINIMAL_DELAY do not do anything
            if (Math.abs(player.savedDelay - currentDelay) < 2) {
                return;
            }
            player.savedDelay = currentDelay;
            console.log(timestamp + ' | New saved delay: ' + currentDelay);
        } else if (currentDelay > SKIP_MARGIN) {
            // If current delay is between SKIP_MARGIN and MINIMAL_DELAY just set
            // savedDelay to MINIMAL_DELAY and continue
            if (player.savedDelay === MINIMAL_DELAY) {
                return;
            }
            player.savedDelay = MINIMAL_DELAY;
            console.log(timestamp + ' | New saved delay: ' + MINIMAL_DELAY);
        } else {
            // If current delay is less then SKIP_MARGIN, we will seek to savedDelay
            const newDelay = player.savedDelay + SKIP_CORRECTION;
            console.log(
                timestamp +
                    ` | Skipping detected. Current delay was: ${currentDelay}, saved: ${player.savedDelay}, seeking: ${newDelay}`,
            );
            seekDelay(newDelay);
        }
    }, 1000);
})();
