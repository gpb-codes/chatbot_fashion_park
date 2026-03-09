const { getChannel } = require("../config/rabbitmq");

async function enviarMensaje(queue, mensaje) {
  const channel = getChannel();

  await channel.assertQueue(queue);

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(mensaje)));
}

module.exports = { enviarMensaje };