const express = require('express');
const http = require('http');
const { initWhatsapp, getClient, isReady } = require('./services/whatsapp');
const { MessageMedia } = require('whatsapp-web.js');
const { Server } = require('socket.io')
//const { Buttons } = require('whatsapp-web.js')
const cors = require('cors');
const app = express();
const server = http.createServer(app);
app.use(express.json());

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// WebSocket: escuchar nuevas conexiones
io.on('connection', (socket) => {
  console.log('🟦 Cliente frontend conectado vía WebSocket');
  socket.emit('ready', isReady() && getClient().info != null)
});


app.get('/contacts', async (req, res) => {

  if(!isReady()) return res.status(500).json({'message' : 'Cliente aun no esta listo'})

  const client = getClient()
  const contacts = await client.getContacts();


  let response = []
  contacts.forEach( contact => {
    const {number,name,pushname, id : {server}, isMyContact, isBusiness} = contact
    if(server !== 'c.us' || !isMyContact || isBusiness) return;
    response.push({number,name : name ? name : pushname, server, isMyContact: isMyContact})
    //response.push({...contact})
  })

  res.json({response})
})

app.post('/start/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  await initWhatsapp(sessionId);
  res.json({ message: `Sesión ${sessionId} iniciada.` });
});

app.post('/send', async (req, res) => {
  const { recipients, message } = req.body
  const client = getClient();
  if (!client) return res.status(400).json({ error: 'Sesión no encontrada o no inicializada.' });

  const text = `
    🎀Estás invitado/a a nuestra revelación de sexo!
    Será un momento lleno de emociones y sorpresas.
    ¿Te gustaría acompañarnos?
    📅 Fecha: 10 de mayo de 2025
    📍 Lugar: Capiata Toledo 
    🏠 http://bit.ly/4im8sVp
    Por favor confirmá tu asistencia:

        1️⃣ No podre asistir
        2️⃣ Si, confirmo
  `;

  try {
    let chatId = null
    //let button = new Buttons('Button body',[{body:'bt1'},{body:'bt2'},{body:'bt3'}],'title','footer');
    for ( let recipient of recipients) {
        chatId = `${recipient}@c.us`
        const media = MessageMedia.fromFilePath('./reveal.png');
        await client.sendMessage(chatId, media, {
          caption: text
        })
    }
    res.json({ message: 'Mensaje enviado' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo enviar el mensaje', details: error.message });
  }
});

// Manejo de errores no atrapados
/* process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
}); */

(async () => {
  await initWhatsapp(6, io);
})()


app.listen(3000, () => console.log('🟢 Servidor corriendo en http://localhost:3000'));
server.listen(3001, () => 'socket activo')