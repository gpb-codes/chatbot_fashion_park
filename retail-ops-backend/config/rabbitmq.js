const amqp = require("amqplib");

let channel;

async function connectRabbit() {
  const connection = await amqp.connect("amqp://guest:guest@localhost:5672");
  channel = await connection.createChannel();

  console.log("Conectado a RabbitMQ");
}

function getChannel() {
  return channel;
}

module.exports = { connectRabbit, getChannel };