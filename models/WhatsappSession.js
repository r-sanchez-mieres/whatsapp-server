const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
  userId: String, // podés usar cualquier identificador
  session: Object
}, { timestamps: true });

module.exports = mongoose.model('WhatsappSession', whatsappSessionSchema);