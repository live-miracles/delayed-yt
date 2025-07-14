const YT_BASE_URL = 'https://www.youtube.com/embed/';

const MINIMAL_DELAY = 600;
const SKIP_MARGIN = 500;
const START_MARGIN = 30;
const SKIP_CORRECTION = 5;
const STREAM_DURATION_CORRECTION = 3600;

const DEFAULT_VIDEO_ID = 'jfKfPfyJRdk';

const player = {
    ytPlayer: null,
    isReady: false,
    startingDuration: -100,
    startingDate: -100,
    videoId: '',
    statusTitle: '',
    startingDelay: -100,
    savedDelay: -100,
};

function updatePlayerData() {
    player.videoId = getVideoId();
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

function getActualDuration(player) {
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
    const newTime = getActualDuration(player) - delay;
    console.log('Seeking to a new delay: ' + delay + ', at time:' + newTime);
    player.ytPlayer.seekTo(newTime);
    player.isReady = false;
}

function updateDelay() {
    const newDelay = getNewDelay();
    seekDelay(newDelay < MINIMAL_DELAY ? MINIMAL_DELAY : newDelay);
}

function adjustDelay(val) {
    const currentDelay = getActualDuration(player) - player.ytPlayer.getCurrentTime();
    let newDelay = currentDelay + val;
    if (newDelay < MINIMAL_DELAY) newDelay = MINIMAL_DELAY;
    seekDelay(newDelay);
}

(() => {
    setInputElements();
    document
        .querySelectorAll('.url-param')
        .forEach((elem) => elem.addEventListener('change', updateUrlParams));

    loadPlayer();
    loadPlayerAPI();

    document.getElementById('video-id').onpaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        e.target.value = extractYouTubeId(paste);
        updateUrlParams();
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

        console.assert(player.videoId && !isNaN(player.savedDelay));
        const currentTime = player.ytPlayer.getCurrentTime();

        const actualDuration = getActualDuration(player);
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

        if (currentDelay >= MINIMAL_DELAY) {
            // If curent delay is more then MINIMAL_DELAY do not do anything
            if (Math.abs(player.savedDelay - currentDelay) < 2) {
                return;
            }
            player.savedDelay = currentDelay;
            console.log('New saved delay:', currentDelay);
        } else if (currentDelay > SKIP_MARGIN) {
            // If curent delay is betwen SKIP_MARGIN and MINIMAL_DELAY just set
            // savedDelay to MINIMAL_DELAY and continute
            if (player.savedDelay === MINIMAL_DELAY) {
                return;
            }
            player.savedDelay = MINIMAL_DELAY;
            console.log('New saved delay:', MINIMAL_DELAY);
        } else {
            // If curent delay is less then SKIP_MARGIN, we will seek to savedDelay
            const newDelay = player.savedDelay + SKIP_CORRECTION;
            console.log(
                `Current delay was: ${currentDelay}, saved delay: ${player.savedDelay}, seeking delay: ${newDelay}`,
            );
            seekDelay(newDelay);
        }
    }, 1000);

    setInterval(() => sendStatusUpdate(player), 1000);
})();
