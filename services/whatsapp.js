const { Client, LocalAuth, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


//const mongoose = require('../db/mongo')
const mysql = require('../db/mysql')
const { MongoStore } = require('wwebjs-mongo');

let client = null
let session_id = null



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
    puppeteer: { headless: true, args: ['--no-sandbox'] }
   /*  authStrategy: new RemoteAuth({
      store, clientId: sessionId,
      backupSyncIntervalMs: 300000
    }) */
  });

  client.on('qr', (qr) => {
    console.log(`📱 [${sessionId}] Escanea este QR:`);
    //qrcode.generate(qr, { small: true });
    io.emit('qr', qr)
  });

  client.on('authenticated', async (session) => {
    //console.log(`✅ [${sessionId}] Cliente autenticado`);
    //console.log('✅ Cliente autenticado');
    //console.log('📌 Client ID:', client.options.authStrategy.clientId);
    //console.log('Auth strategy:', client.options.authStrategy.constructor.name);
  });

  client.on('auth_failure', () => {
    console.error(`❌ [${sessionId}] Falló la autenticación`);
  });

  client.on('ready', () => {
    console.log(`🤖 [${sessionId}] Cliente listo`);
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

  client.on('disconnected', (reason) => {
    console.warn('⚠️ WhatsApp desconectado:', reason);
    //client.destroy();
    //initWhatsapp(session_id); // intentás reconectar
  });


  await client.initialize()
}

function getClient() {
  return client;
}

module.exports = {
  initWhatsapp, getClient
};