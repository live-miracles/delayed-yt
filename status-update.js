function sendStatusUpdate(player) {
    const statusServer = player.statusServer;
    const title = player.statusTitle;
    if (!URL.canParse(statusServer) || !title) {
        return;
    }
    const id = player.videoId;
    const delay = Math.floor(player.savedDelay);
    const duration = Math.floor(getActualDuration(player));

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
