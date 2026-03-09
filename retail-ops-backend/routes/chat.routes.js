const express = require('express');
const router = express.Router();
const { enviarMensaje } = require('../services/rabbitmq.service');

router.post('/chat', async (req, res) => {
    const  mensaje = req.body;

    await enviarMensaje('chat_queue', mensaje);

    res.json({
        status: " mensaje enviado a la cola"
    });
});

module.exports = router;

   