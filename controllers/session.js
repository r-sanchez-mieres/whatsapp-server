const whatsappService = require('../services/whatsappService');

const createSession = async (req, res) => {
    const sessionId = req.params.id;
    try {
        await whatsappService.initClient(sessionId);
        res.json({ status: 'QR generado, escanea para iniciar sesión' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getQR = async (req, res) => {
    const sessionId = req.params.id;
    const qr = await whatsappService.getQRCode(sessionId);
    if (qr) {
        res.json({ qr });
    } else {
        res.status(404).json({ error: 'No disponible o ya autenticado' });
    }
};

const sendMessage = async (req, res) => {
    const { number, message } = req.body;
    const sessionId = req.params.id;
    try {
        await whatsappService.sendMessage(sessionId, number, message);
        res.json({ status: 'Mensaje enviado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createSession, getQR, sendMessage };