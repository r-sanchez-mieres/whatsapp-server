const express = require('express');
const router = express.Router();
const { createSession, getQR, sendMessage } = require('../controllers/sessionController');

router.post('/session/:id', createSession);
router.get('/session/:id/qr', getQR);
router.post('/session/:id/send', sendMessage);

module.exports = router;