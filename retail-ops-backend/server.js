const express = require('express');
const cors = require('cors');
const { connectRabbit } = require('./config/rabbitmq');
const chatRoutes = require('./routes/chat.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);

async function startServer() {
  await connectRabbit();

  app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');

  });
}

startServer();