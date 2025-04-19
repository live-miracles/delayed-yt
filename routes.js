const express = require('express');
const router = express.Router();

// Single map to track statuses and their timers
const statusMap = new Map();

// Function to remove status by ID
function removeStatusById(id) {
    statusMap.delete(id);
    console.log(`Removed status with id ${id} due to timeout.`);
}

router.post('/status', (req, res) => {
    const { id, title, delay, duration } = req.body;
    const ip = req.ip.replace('::ffff:', '');

    if (!id || !title || typeof delay !== 'number' || typeof duration !== 'number') {
        return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    if (statusMap.has(id)) {
        clearTimeout(statusMap.get(id).timer);
    }
    const timer = setTimeout(() => removeStatusById(id), 10000);

    statusMap.set(id, { id, title, delay, duration, ip, timer });

    res.status(200).json({ message: 'Status saved' });
});

router.get('/stats', (req, res) => {
    // Extract only the status data (without timers)
    const stats = Array.from(statusMap.values()).map(({ timer, ...status }) => status);
    res.json(stats);
});

module.exports = router;
