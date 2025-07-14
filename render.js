function getVideoId() {
    return document.getElementById('video-id').value;
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

function getNewDelay() {
    const delayH = parseInt(document.getElementById('new-delay-hour').value);
    const delayM = parseInt(document.getElementById('new-delay-min').value);
    const delayS = parseInt(document.getElementById('new-delay-sec').value);
    const delay = delayH * 3600 + delayM * 60 + delayS;
    console.assert(delay >= MINIMAL_DELAY);
    if (delay < MINIMAL_DELAY) {
        console.error(`Delay shouldn't be less than ${MINIMAL_DELAY}s`);
        return MINIMAL_DELAY;
    }
    return delay;
}

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
