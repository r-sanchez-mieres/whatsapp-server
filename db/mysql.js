const mysql = require('mysql2');

let conections = [
  {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wapp'
  },
  {
    host: 'database-1.cahicyc4kx6o.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'aRTURO.D3V',
    database: 'whatsapp'
  }
]

const db = mysql.createConnection(conections[1]);

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
});

module.exports = db;