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
    let p1 = status.title;
    let p2 = `${status.id} <span class="text-secondary">|</span> ${status.ip}`;
    let p3 = durationToString(status.delay);
    let p4 = durationToString(status.duration);

    if (status.error) {
        p1 = status.error;
        p2 = '';
        p3 = 'Error';
        p4 = '';
    }
    return `
        <div class="w-fit min-w-[450px] max-w-[700px] h-fit text-center bg-neutral rounded-lg shadow-md m-2 p-3">
            <p class="text-3xl">${p2}</p>
            <p>
                <span class="text-7xl ${status.error ? 'text-error' : ''}">${p3}</span>
                <span class="text-3xl ml-3">${p4}</span>
            </p>
            <p class="font-semibold text-3xl text-secondary my-1">${p1}</p>

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
