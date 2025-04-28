const { Client, LocalAuth, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs')
const path = require('path')


//const mongoose = require('../db/mongo')
const mysql = require('../db/mysql')
const { MongoStore } = require('wwebjs-mongo');

let client = null
let session_id = null
let ready = false



const has_response = ( number ) => {
  const sql = "SELECT 1 FROM reveal_confirm WHERE `number` = ? LIMIT 1"
  
  return new Promise(( resolve, reject) => {
      mysql.query(sql, [ number], ( err, result ) => {
          if ( err ) return reject(err)
          resolve(result)
      })
  })
 
}


async function initWhatsapp(sessionId, io) {
  // Intentar recuperar la sesión desde MySQL

  //const store = new MongoStore({mongoose: mongoose})
  session_id = sessionId
  client = new Client({
    puppeteer: { headless: true, args: ['--no-sandbox'] },
    authStrategy: new LocalAuth({
        clientId: "cliente1"  // Opcional, si querés manejar múltiples sesiones
    }),
   /*  authStrategy: new RemoteAuth({
      store, clientId: sessionId,
      backupSyncIntervalMs: 300000
    }) */
  });

  client.on('qr', (qr) => {
    console.log(`📱 [${sessionId}] Escanea este QR:`);
    //qrcode.generate(qr, { small: true });
    io.emit('qr', qr)
    io.emit('ready', false)
  });

  client.on('authenticated', async (session) => {
    //console.log(`✅ [${sessionId}] Cliente autenticado`);
    //console.log('✅ Cliente autenticado');
    //console.log('📌 Client ID:', client.options.authStrategy.clientId);
    //console.log('Auth strategy:', client.options.authStrategy.constructor.name);

    console.log('session', session)
    io.emit('ready', true)
  });

  client.on('auth_failure', () => {
    console.error(`❌ [${sessionId}] Falló la autenticación`);
  });

  client.on('ready', async () => {
    console.log(`🤖 [${sessionId}] Cliente listo`);
    //console.log('aut', client.info)
    const me = client.info.wid.user
    const nro = client.info.pushname

    ready = true

    //console.log(JSON.stringify({me,nro}))
  });


  client.on('remote_session_saved', () => {
    console.log('💾 Sesión guardada remotamente');
  });

  client.on('message', async (wappdata) => {
    const chat = await wappdata.getChat();
    const contact = await wappdata.getContact()
    const { isGroup, isBroadcast } = chat
    const { body, from } = wappdata
    const response = body.trim();
    const reply = {
        2 : 'Gracias por confirmar tu asistencia ❤️😊',
        1 : 'Muchas Gracias por responder! Lamentamos que no puedas asistir 🥲'
    }
  
    let number = from.replace(/@c.us/gi,'')
    let has_responded = await has_response(number)
    if ( !isGroup && !isBroadcast && response.length == 1 && !isNaN(response) && ['1','2'].includes(response) && has_responded.length == 0) {
  
  
        client.sendMessage(from, reply[response])        
        const {name: contact_name_chat } = chat
        const { pushname : nick_name, name : contact_name, number : contact_number } = contact
  
  
        
        const sql = `INSERT INTO reveal_confirm (confirm,number,contact_name, nick) VALUES (?, ?, ?, ?)`;
        mysql.query(sql, [ response - 1, contact_number, contact_name ?? contact_name_chat, nick_name ], ( err, result) => {
            if(err) {
                console.error('error: ', err)
            } else {
                console.log('Ok')
            }
        })
    } else {
        
    }
  })

  client.on('message_create', (msg) => {
    if (msg.fromMe) {
      //console.log(`📤 Mensaje enviado: ${msg.body}`);
    }
  });

  const df = () => {

    const sessionPath = path.join(path.resolve(__dirname, '..'), '.wwebjs_auth', 'session-cliente1');
    if (fs.existsSync(sessionPath)) {
      try {
        //client.destroy()
        fs.rmdirSync(sessionPath, { recursive: true });
        console.log('📂 Carpeta de sesión eliminada al cerrar sesión');
      } catch (error) {
        console.error('Error al eliminar la carpeta de sesión:');
        setTimeout(() => df(),3000)
      }
    }
  }

  client.on('disconnected', async (reason) => {
    console.warn('⚠️ WhatsApp desconectado:', reason); // LOGOUT al cerrar sesion adrede
    await client.destroy();
    //initWhatsapp(session_id); // intentás reconectar

    const sessionPath = path.join(path.resolve(__dirname, '..'), '.wwebjs_auth', 'session-cliente1');

    /* if(reason == 'LOGOUT') {
      //df()
      //await client.destroy()
      io.emit('ready', false)
      await client.initialize()
    } else {

      if(fs.existsSync(sessionPath)) {
        // delay para evitar reconexión inmediata
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('intentando reconectar')
        await client.initialize()
      }
    } */

    await new Promise(resolve => setTimeout(resolve, 3000));
    await client.initialize()

  });


  await client.initialize()
}

const getClient = () => {
  return client
}
const isReady = () => {
  return ready
}

module.exports = {
  initWhatsapp, getClient, isReady
};