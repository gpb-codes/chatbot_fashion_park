const amqp = require("amqplib");

async function startWorker() {

  const connection = await amqp.connect("amqp://guest:guest@localhost:5672");

  const channel = await connection.createChannel();

  const queue = "chat_queue";

  await channel.assertQueue(queue);

  console.log("Worker escuchando mensajes...");

  channel.consume(queue, (msg) => {

    const data = JSON.parse(msg.content.toString());

    console.log("Mensaje recibido:", data);

    channel.ack(msg);

  });

}

startWorker();