function getCurrentDate() {
    return new Date().getTime() / 1000;
}

function extractYouTubeId(str) {
    try {
        const url = new URL(str);
        const vParam = url.searchParams.get('v');
        if (vParam) {
            // https://www.youtube.com/watch?v=12345
            return vParam;
        } else if (url.pathname.startsWith('/live/')) {
            // https://www.youtube.com/live/12345
            return url.pathname.slice(6);
        } else if (url.origin === 'https://youtu.be') {
            // https://youtu.be/12345
            return url.pathname.slice(1);
        } else {
            return str;
        }
    } catch (error) {
        return str;
    }
}

function durationToString(duration) {
    const dur = parseInt(duration);
    const h = Math.floor(dur / 3600);
    const m = Math.floor((dur % 3600) / 60);
    const s = Math.floor(dur % 60);
    return `${h > 0 ? h + 'h ' : ''}${h > 0 || m > 0 ? m + 'm ' : ''}${s}s`;
}

// ===== Document Config & URL Utils =====
function setInputValue(id, value) {
    const input = document.getElementById(id, value);
    console.assert(input !== null, 'Can\'t find element with ID "' + id + '"');
    if (input === null) {
        return;
    }

    if (input.type === 'checkbox') {
        console.assert(['0', '1'].includes(value));
        input.checked = value === '1';
    } else if (input.type === 'text' || input.type === 'number' || input.type === 'url') {
        input.value = value;
    } else {
        console.error('Unknown input type: ' + input.type);
    }
}

function getConfigUrlParams() {
    const url = window.location.href;
    const searchParams = new URLSearchParams(new URL(url).search);
    const params = [];
    searchParams.forEach(function (value, key) {
        if (key === '' || !key.startsWith('__')) return;
        params.push({ key: key.substring(2), value: value });
    });
    return params;
}

function setInputElements() {
    const urlParams = getConfigUrlParams();
    urlParams.forEach((param) => setInputValue(param.key, param.value));
}

function parseDocumentConfig() {
    const params = new URLSearchParams();

    document.querySelectorAll('.url-param').forEach((input) => {
        if (input.type === 'checkbox') {
            params.append('__' + input.id, input.checked ? '1' : '0');
        } else if (input.type === 'text' || input.type === 'number' || input.type === 'url') {
            params.append('__' + input.id, String(input.value));
        } else {
            console.error('unexpected type: ' + input.type);
        }
    });
    return params;
}

function updateUrlParams() {
    const configParams = parseDocumentConfig();
    window.history.pushState({}, '', `?${configParams.toString()}`);
}
