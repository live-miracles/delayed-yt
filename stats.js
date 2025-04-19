function getStatsServer() {
    return document.getElementById('stats-server').value;
}

async function fetchStats() {
    const statsServer = getStatsServer();

    if (!statsServer) {
        return;
    }

    try {
        const response = await fetch(statsServer);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();
        return { stats: stats, error: null }; // Return full data if needed
    } catch (error) {
        return { stats: [], error: String(error) };
    }
}

function getBoxHtml(status) {
    let delay = durationToString(status.delay);
    let duration = durationToString(status.duration);

    const err = status.error;
    return `
        <div class="w-fit min-w-[150px] max-w-[300px] h-fit text-center bg-neutral rounded-lg shadow-md m-1 p-1">
            <p class="text-xl font-semibold my-1">
                <span class="text-secondary">${err ? '' : status.title}</span>
                <span class="${err ? 'text-error' : ''}">${err ? 'Error' : delay}</span>
            </p>
            <span class="text-sm">${err ? '' : duration}</span>
            <span class="text-secondary">|</span>
            <span class="text-sm">${err ? '' : status.id}</span>
            <p class="text-sm">${err ? err : status.ip}</p>
        </div>`;
}

async function renderStats() {
    const res = await fetchStats();
    if (res.error) {
        res.stats = [{ error: res.error }];
    }
    const html = res.stats
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((status) => getBoxHtml(status))
        .join('');
    document.getElementById('boxes').innerHTML = html;
}

(() => {
    setInputElements();
    document
        .querySelectorAll('.url-param')
        .forEach((elem) => elem.addEventListener('change', updateUrlParams));

    renderStats();
    setInterval(renderStats, 1000);
})();
