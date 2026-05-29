import {
  durationToString,
  extractYouTubeId,
  getCurrentDate,
  setDocumentUrlParams,
  updateUrlParam,
} from "./tools.js";

const YT_BASE_URL = "https://www.youtube.com/embed/";

const MINIMAL_DELAY = 600;
const SKIP_MARGIN = 500;
const START_MARGIN = 30;
const SKIP_CORRECTION = 5;
const STREAM_DURATION_CORRECTION = 3600;
const DELAY_DIFF_MARGIN = 60;

type PlayerState = {
  ytPlayer: YouTubePlayer | null;
  isReady: boolean;
  startingDuration: number;
  startingDate: number;
  recentStreamRetryDate: number;
  videoId: string;
  startingDelay: number;
  savedDelay: number;
  allowDelayChange: boolean;
};

const player: PlayerState = {
  ytPlayer: null,
  isReady: false,
  startingDuration: -100,
  startingDate: -100,
  recentStreamRetryDate: -100,
  videoId: "",
  startingDelay: -100,
  savedDelay: -100,
  allowDelayChange: false,
};

let isPlayerAPIRequested = false;

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const elem = document.getElementById(id);
  if (!elem) throw new Error(`Element not found: ${id}`);
  return elem as T;
}

function getRequiredPlayer(): YouTubePlayer {
  if (!player.ytPlayer) throw new Error("YouTube player is not ready");
  return player.ytPlayer;
}

function loadPlayer(): void {
  updatePlayerData();
  const playerElem = getRequiredElement<HTMLIFrameElement>("player");
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
  playerElem.src = `${YT_BASE_URL}${player.videoId}?autoplay=1&enablejsapi=1&iv_load_policy=3`;
  loadPlayerAPI();
}

async function loadNewVideo(): Promise<void> {
  updatePlayerData();
  if (!player.videoId) {
    loadPlayer();
    return;
  }
  if (!player.ytPlayer) {
    loadPlayer();
    return;
  }
  await getRequiredPlayer().loadVideoById({ videoId: player.videoId });
}

function loadPlayerAPI(): void {
  if (isPlayerAPIRequested) return;
  isPlayerAPIRequested = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady(): void {
  player.ytPlayer = new YT.Player("player", {
    events: {
      onReady: loadNewVideo,
      onStateChange: onPlayerStateChange,
    },
  });
};

function onPlayerStateChange(event: YouTubePlayerEvent): void {
  if (event.data === YT.PlayerState.PLAYING) {
    const duration =
      getRequiredPlayer().getDuration() - STREAM_DURATION_CORRECTION;
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

function updatePlayerData(): void {
  player.isReady = false;
  player.videoId = getVideoId();
  player.startingDelay = getDelay();
  player.allowDelayChange = getAllowDelayChange();
  player.savedDelay = getDelay() - SKIP_CORRECTION;
}

function getActualDuration(playerState: PlayerState): number {
  if (playerState.startingDuration < 0) {
    console.error("Invalid duration:", playerState.startingDuration);
    return 0;
  }

  if (playerState.startingDuration === 0) return 0;

  if (playerState.startingDate <= 0) {
    console.error("Invalid time:", playerState.startingDate);
    return 0;
  }
  const ans =
    playerState.startingDuration +
    (getCurrentDate() - playerState.startingDate);

  if (ans <= 0) {
    console.error("Invalid actual duration:", ans);
    return 0;
  }
  return ans;
}

function seekDelay(delay: number): void {
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

function adjustDelay(val: number): void {
  const currentDelay =
    getActualDuration(player) - getRequiredPlayer().getCurrentTime();
  let newDelay = currentDelay + val;
  if (newDelay < MINIMAL_DELAY) newDelay = MINIMAL_DELAY;
  seekDelay(newDelay);
}

function getVideoId(): string {
  return getRequiredElement<HTMLInputElement>("v").value;
}

function getDelay(): number {
  const delayH = parseInt(getRequiredElement<HTMLInputElement>("h").value);
  const delayM = parseInt(getRequiredElement<HTMLInputElement>("m").value);
  const delayS = parseInt(getRequiredElement<HTMLInputElement>("s").value);
  const delay = delayH * 3600 + delayM * 60 + delayS;
  console.assert(delay >= MINIMAL_DELAY);
  if (delay < MINIMAL_DELAY) {
    console.error(`Delay shouldn't be less than ${MINIMAL_DELAY}s`);
    return MINIMAL_DELAY;
  }
  return delay;
}

function getAllowDelayChange(): boolean {
  return getRequiredElement<HTMLInputElement>("c").checked;
}

function getShowDelay(): boolean {
  return getRequiredElement<HTMLInputElement>("d").checked;
}

function toggleShowDelay(): void {
  getRequiredElement<HTMLInputElement>("d").checked = !getShowDelay();

  const delayInfo = getRequiredElement("delay-info");
  if (getShowDelay()) {
    delayInfo.classList.add("opacity-30");
    delayInfo.classList.remove("opacity-0");
  } else {
    delayInfo.classList.add("opacity-0");
    delayInfo.classList.remove("opacity-30");
  }
}

function renderStats(duration: number | null, delay: number | null): void {
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

function tick(alertElem: Element): void {
  if (!player.isReady) {
    console.log(new Date().toLocaleTimeString() + " | Player not ready");
    renderStats(null, null);
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
  const timestamp = new Date().toLocaleTimeString();

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
    if (Math.abs(player.savedDelay - currentDelay) < 2) {
      return;
    }
    player.savedDelay = currentDelay;
    console.log(timestamp + " | New saved delay: " + currentDelay);
  } else if (currentDelay > SKIP_MARGIN) {
    if (player.savedDelay === MINIMAL_DELAY) {
      return;
    }
    player.savedDelay = MINIMAL_DELAY;
    console.log(timestamp + " | New saved delay: " + MINIMAL_DELAY);
  } else {
    const newDelay = player.savedDelay + SKIP_CORRECTION;
    console.log(
      timestamp +
        ` | Skipping detected. Current delay was: ${currentDelay}, saved: ${player.savedDelay}, seeking: ${newDelay}`,
    );
    seekDelay(newDelay);
  }
}

function init(): void {
  setDocumentUrlParams();
  document
    .querySelectorAll(".url-param")
    .forEach((elem) => elem.addEventListener("change", updateUrlParam));

  loadPlayer();

  getRequiredElement<HTMLInputElement>("v").onpaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData?.getData("text") ?? "";
    const input = e.currentTarget as HTMLInputElement;
    input.value = extractYouTubeId(paste);
    updateUrlParam(e);
  };

  const alertElem = document.querySelector(".alert");
  if (!alertElem) throw new Error("Alert element not found");

  getRequiredElement("delay-info").addEventListener("click", toggleShowDelay);
  getRequiredElement("update-video").addEventListener("click", () => {
    void loadNewVideo();
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-delay-adjust]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        adjustDelay(Number(button.dataset.delayAdjust));
      });
    });

  document.addEventListener("keydown", (event) => {
    if (event.key === "d" || event.key === "D") toggleShowDelay();
  });

  setInterval(() => tick(alertElem), 1000);
}

init();
