
const mongoose = require('mongoose');
const app = require('./app');
const port = process.env.PORT || 3000;

const dbURI = 'mongodb+srv://admin:admin@db-contacts.vwiudqe.mongodb.net/db-contacts?retryWrites=true&w=majority';

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connection successful');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
