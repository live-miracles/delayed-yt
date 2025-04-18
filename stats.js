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
    let small = `${status.title} (${status.id})`;
    let big = durationToString(status.delay);
    if (status.error) {
        small = status.error;
        big = 'Error';
    }
    return `
        <div class="w-[500px] h-[200px] text-center bg-neutral rounded-lg shadow-md m-2 p-2">
            <h3 class="text-3xl">${small}</h3>
            <p class="text-9xl ${status.error ? 'text-error' : ''}">${big}</p>
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
