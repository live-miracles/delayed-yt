import { durationToString, extractYouTubeId, getCurrentDate, setDocumentUrlParams, updateUrlParam, } from "./tools.js";
const YT_BASE_URL = "https://www.youtube.com/embed/";
const MINIMAL_DELAY = 600;
const SKIP_MARGIN = 500;
const START_MARGIN = 30;
const SKIP_CORRECTION = 5;
const STREAM_DURATION_CORRECTION = 3600;
const DELAY_DIFF_MARGIN = 60;
const RECORDED_DRIFT_MARGIN = 5;
const player = {
    ytPlayer: null,
    isReady: false,
    mode: "live",
    startingDuration: -100,
    startingDate: -100,
    recentStreamRetryDate: -100,
    videoId: "",
    startingDelay: -100,
    recordedStartTime: -100,
    savedDelay: -100,
    allowDelayChange: false,
    isRecordedSeekPending: false,
};
let isPlayerAPIRequested = false;
function getRequiredElement(id) {
    const elem = document.getElementById(id);
    if (!elem)
        throw new Error(`Element not found: ${id}`);
    return elem;
}
function getRequiredPlayer() {
    if (!player.ytPlayer)
        throw new Error("YouTube player is not ready");
    return player.ytPlayer;
}
function loadPlayer() {
    updatePlayerData();
    const playerElem = getRequiredElement("player");
    const placeholderElem = getRequiredElement("player-placeholder");
    if (!player.videoId) {
        playerElem.classList.add("hidden");
        placeholderElem.classList.remove("hidden");
        playerElem.src = "";
        renderStats(null, null);
        return;
    }
    playerElem.classList.remove("hidden");
    placeholderElem.classList.add("hidden");
    const startParam = player.mode === "recorded" ? `&start=${getExpectedRecordedTime()}` : "";
    playerElem.src = `${YT_BASE_URL}${player.videoId}?autoplay=1&enablejsapi=1&iv_load_policy=3${startParam}`;
    loadPlayerAPI();
}
async function loadNewVideo() {
    updatePlayerData();
    if (!player.videoId) {
        loadPlayer();
        return;
    }
    if (!player.ytPlayer) {
        loadPlayer();
        return;
    }
    await getRequiredPlayer().loadVideoById({
        videoId: player.videoId,
        ...(player.mode === "recorded"
            ? { startSeconds: getExpectedRecordedTime() }
            : {}),
    });
}
function loadPlayerAPI() {
    if (isPlayerAPIRequested)
        return;
    isPlayerAPIRequested = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
}
window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
    player.ytPlayer = new YT.Player("player", {
        events: {
            onReady: loadNewVideo,
            onStateChange: onPlayerStateChange,
        },
    });
};
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        if (player.mode === "recorded") {
            const currentTime = getRequiredPlayer().getCurrentTime();
            player.startingDuration = getRequiredPlayer().getDuration();
            if (player.isRecordedSeekPending) {
                player.isRecordedSeekPending = false;
                seekRecordedTime(getExpectedRecordedTime());
                return;
            }
            if (!player.isReady) {
                player.startingDate = getCurrentDate();
            }
            player.isReady = true;
            return;
        }
        const duration = getRequiredPlayer().getDuration() - STREAM_DURATION_CORRECTION;
        if (Math.abs(duration - player.startingDuration) > 10) {
            player.startingDate = getCurrentDate();
            player.startingDuration = duration;
            player.recentStreamRetryDate = player.startingDate;
            console.log("Player started. Duration:", player.startingDuration);
            void loadNewVideo();
        }
        player.isReady = true;
    }
}
function updatePlayerData() {
    player.isReady = false;
    const previousMode = player.mode;
    player.videoId = getVideoId();
    player.mode = getVideoMode();
    player.startingDelay = getDelay();
    player.recordedStartTime = getRecordedStartTime();
    player.allowDelayChange =
        player.mode === "live" ? getAllowDelayChange() : false;
    player.savedDelay = getDelay() - SKIP_CORRECTION;
    player.isRecordedSeekPending = player.mode === "recorded";
    updateModeUi();
    if (previousMode !== player.mode)
        renderStats(null, null);
}
function getActualDuration(playerState) {
    if (playerState.startingDuration < 0) {
        console.error("Invalid duration:", playerState.startingDuration);
        return 0;
    }
    if (playerState.startingDuration === 0)
        return 0;
    if (playerState.startingDate <= 0) {
        console.error("Invalid time:", playerState.startingDate);
        return 0;
    }
    const ans = playerState.startingDuration +
        (getCurrentDate() - playerState.startingDate);
    if (ans <= 0) {
        console.error("Invalid actual duration:", ans);
        return 0;
    }
    return ans;
}
function seekDelay(delay) {
    if (isNaN(delay)) {
        console.error("Delay should be a positive number, but it is: " + delay);
        return;
    }
    console.assert(delay >= MINIMAL_DELAY);
    const newTime = getActualDuration(player) - delay;
    console.log("Seeking to a new delay: " + delay + ", at time: " + newTime);
    player.isReady = false;
    getRequiredPlayer().seekTo(newTime);
}
function seekRecordedTime(time) {
    const duration = getRequiredPlayer().getDuration();
    const newTime = Math.max(0, duration > 0 ? Math.min(time, duration) : time);
    console.log("Seeking to video time: " + newTime);
    player.isReady = false;
    getRequiredPlayer().seekTo(newTime);
}
function adjustDelay(val) {
    if (player.mode === "recorded") {
        return;
    }
    const currentDelay = getActualDuration(player) - getRequiredPlayer().getCurrentTime();
    let newDelay = currentDelay + val;
    if (newDelay < MINIMAL_DELAY)
        newDelay = MINIMAL_DELAY;
    seekDelay(newDelay);
}
function getVideoId() {
    return getRequiredElement("v").value;
}
function getDelay() {
    const delayH = parseInt(getRequiredElement("h").value);
    const delayM = parseInt(getRequiredElement("m").value);
    const delayS = parseInt(getRequiredElement("s").value);
    const delay = delayH * 3600 + delayM * 60 + delayS;
    if (getVideoMode() === "recorded") {
        return Math.max(0, delay);
    }
    console.assert(delay >= MINIMAL_DELAY);
    if (delay < MINIMAL_DELAY) {
        console.error(`Delay shouldn't be less than ${MINIMAL_DELAY}s`);
        return MINIMAL_DELAY;
    }
    return delay;
}
function getRecordedStartTime() {
    const startH = parseInt(getRequiredElement("h").value);
    const startM = parseInt(getRequiredElement("m").value);
    const startS = parseInt(getRequiredElement("s").value);
    return startH * 3600 + startM * 60 + startS;
}
function getExpectedRecordedTime() {
    const now = new Date();
    const start = new Date(now);
    const startH = Math.floor(player.recordedStartTime / 3600);
    const startM = Math.floor((player.recordedStartTime % 3600) / 60);
    const startS = Math.floor(player.recordedStartTime % 60);
    start.setHours(startH, startM, startS, 0);
    if (start.getTime() > now.getTime()) {
        start.setDate(start.getDate() - 1);
    }
    return Math.max(0, (now.getTime() - start.getTime()) / 1000);
}
function getVideoMode() {
    return getRequiredElement("r").checked
        ? "recorded"
        : "live";
}
function getAllowDelayChange() {
    return getRequiredElement("c").checked;
}
function getShowDelay() {
    return getRequiredElement("d").checked;
}
function toggleShowDelay() {
    getRequiredElement("d").checked = !getShowDelay();
    const delayInfo = getRequiredElement("delay-info");
    if (getShowDelay()) {
        delayInfo.classList.add("opacity-30");
        delayInfo.classList.remove("opacity-0");
    }
    else {
        delayInfo.classList.add("opacity-0");
        delayInfo.classList.remove("opacity-30");
    }
}
function updateModeUi() {
    const isRecorded = getVideoMode() === "recorded";
    getRequiredElement("duration-stat-title").innerHTML = isRecorded
        ? "Duration"
        : "Duration";
    getRequiredElement("delay-stat-title").innerHTML = isRecorded
        ? "Position"
        : "Delay";
    getRequiredElement("mode-time-label").innerHTML = isRecorded
        ? "Video Start"
        : "Starting Delay";
    getRequiredElement("mode-time-note").innerHTML = isRecorded
        ? "Local clock time"
        : "Min: 10 min";
    getRequiredElement("allow-change-label").innerHTML = isRecorded
        ? "Allow position changes"
        : "Allow delay changes";
    const allowChangeInput = getRequiredElement("c");
    const allowChangeControl = getRequiredElement("allow-change-control");
    allowChangeInput.disabled = isRecorded;
    if (isRecorded)
        allowChangeInput.checked = false;
    allowChangeControl.classList.toggle("opacity-50", isRecorded);
    document
        .querySelectorAll("[data-delay-adjust]")
        .forEach((button) => {
        button.disabled = isRecorded;
        button.classList.toggle("opacity-50", isRecorded);
    });
}
function renderStats(duration, delay) {
    const durationElem = getRequiredElement("duration-stat");
    const delayElem = getRequiredElement("delay-stat");
    const delayInfo = getRequiredElement("delay-info");
    if (duration === null || delay === null) {
        durationElem.innerHTML = "???";
        delayElem.innerHTML = "???";
        delayInfo.innerHTML = "???";
        return;
    }
    durationElem.innerHTML = durationToString(duration);
    delayElem.innerHTML = durationToString(delay);
    delayInfo.innerHTML = durationToString(delay);
}
function tickRecordedVideo(timestamp) {
    const ytPlayer = getRequiredPlayer();
    const currentTime = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();
    if (isNaN(currentTime) || isNaN(duration)) {
        console.error(timestamp + " | Invalid recorded player time");
        renderStats(null, null);
        return;
    }
    renderStats(duration, currentTime);
    if (ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
        return;
    }
    const expectedTime = Math.min(duration, getExpectedRecordedTime());
    const drift = currentTime - expectedTime;
    if (!player.allowDelayChange && Math.abs(drift) > RECORDED_DRIFT_MARGIN) {
        console.log(timestamp +
            ` | Video jump detected. Current time: ${currentTime}, expected: ${expectedTime}`);
        seekRecordedTime(expectedTime);
        return;
    }
}
function tick(alertElem) {
    if (!player.isReady) {
        console.log(new Date().toLocaleTimeString() + " | Player not ready");
        renderStats(null, null);
        return;
    }
    const timestamp = new Date().toLocaleTimeString();
    if (player.mode === "recorded") {
        alertElem.classList.add("hidden");
        tickRecordedVideo(timestamp);
        return;
    }
    if (player.startingDuration === 0) {
        const now = getCurrentDate();
        if (now - player.recentStreamRetryDate > 5 * 60) {
            player.recentStreamRetryDate = now;
            void loadNewVideo();
        }
        alertElem.classList.remove("hidden");
        renderStats(null, null);
        return;
    }
    console.assert(player.videoId && !isNaN(player.savedDelay));
    const currentTime = getRequiredPlayer().getCurrentTime();
    const actualDuration = getActualDuration(player);
    if (isNaN(actualDuration)) {
        console.error(timestamp + " | Invalid actualDuration: " + actualDuration);
        renderStats(null, null);
        return;
    }
    if (isNaN(currentTime)) {
        console.error(timestamp + " | Invalid currentTime: " + currentTime);
        renderStats(null, null);
        return;
    }
    const currentDelay = actualDuration - currentTime;
    console.assert(currentDelay > -10, "Invalid current delay: " + currentDelay);
    renderStats(actualDuration, currentDelay);
    if (actualDuration < player.startingDelay) {
        return;
    }
    if (currentTime < START_MARGIN) {
        return;
    }
    if (!player.allowDelayChange &&
        Math.abs(currentDelay - player.startingDelay) > DELAY_DIFF_MARGIN) {
        let newDelay = player.savedDelay + SKIP_CORRECTION;
        if (Math.abs(newDelay - player.startingDelay) > DELAY_DIFF_MARGIN)
            newDelay = player.startingDelay;
        console.log(timestamp +
            ` | Current delay was: ${currentDelay}, saved: ${player.savedDelay}, seeking: ${newDelay}`);
        seekDelay(newDelay);
    }
    else if (currentDelay >= MINIMAL_DELAY) {
        if (Math.abs(player.savedDelay - currentDelay) < 2) {
            return;
        }
        player.savedDelay = currentDelay;
        console.log(timestamp + " | New saved delay: " + currentDelay);
    }
    else if (currentDelay > SKIP_MARGIN) {
        if (player.savedDelay === MINIMAL_DELAY) {
            return;
        }
        player.savedDelay = MINIMAL_DELAY;
        console.log(timestamp + " | New saved delay: " + MINIMAL_DELAY);
    }
    else {
        const newDelay = player.savedDelay + SKIP_CORRECTION;
        console.log(timestamp +
            ` | Skipping detected. Current delay was: ${currentDelay}, saved: ${player.savedDelay}, seeking: ${newDelay}`);
        seekDelay(newDelay);
    }
}
function init() {
    setDocumentUrlParams();
    updateModeUi();
    document.querySelectorAll(".url-param").forEach((elem) => elem.addEventListener("change", (event) => {
        updateUrlParam(event);
        updateModeUi();
    }));
    loadPlayer();
    getRequiredElement("v").onpaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData?.getData("text") ?? "";
        const input = e.currentTarget;
        input.value = extractYouTubeId(paste);
        updateUrlParam(e);
    };
    const alertElem = document.querySelector(".alert");
    if (!alertElem)
        throw new Error("Alert element not found");
    getRequiredElement("delay-info").addEventListener("click", toggleShowDelay);
    getRequiredElement("update-video").addEventListener("click", () => {
        void loadNewVideo();
    });
    document
        .querySelectorAll("[data-delay-adjust]")
        .forEach((button) => {
        button.addEventListener("click", () => {
            adjustDelay(Number(button.dataset.delayAdjust));
        });
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "d" || event.key === "D")
            toggleShowDelay();
    });
    setInterval(() => tick(alertElem), 1000);
}
init();
//# sourceMappingURL=script.js.map