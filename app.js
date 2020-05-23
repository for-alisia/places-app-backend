const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const placesRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const { MONGO_URL } = require('./config');

//Create express instance
const app = express();

//Middlewares

//Parse any body for the request(POST, PATCH requests)
app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

//Set headers to the responses to solve a CORS error in browser
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

//Custom routes
app.use('/api/places', placesRoutes); //All Places related routes

app.use('/api/users', userRoutes); //All User related routes

//Error handling (404)
// if no one route was found
app.use((req, res, next) => {
  const error = new HttpError("Couldn't find this route", 404);
  throw error;
});
//Handling thrown error
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, () => {
      console.log(error);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    message: error.message || 'An unknown error occured',
  });
});

//Connect to mongo (using mongoose). Return promise. If connection was success, start server
// Configuration object
const connectConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

mongoose
  .connect(MONGO_URL, connectConfig)
  .then(() => {
    console.log('Successfull connection');
    //Start server, if connection success
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
