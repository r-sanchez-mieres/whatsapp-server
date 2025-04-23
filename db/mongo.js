const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://db-user:Arturo.dev@cluster0.yhglp0c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('open', () => {
  console.log('🟢 Conectado a MongoDB');
});

module.exports = mongoose;