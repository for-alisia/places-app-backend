const express = require('express');
const bodyParser = require('body-parser');

const placesRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

//Middlewares

//Parse any body for the request(POST, PATCH requests)
app.use(bodyParser.json());

//Custom routes
app.use('/api/places', placesRoutes);

app.use('/api/users', userRoutes);

//Error handling (404)
app.use((req, res, next) => {
    const error = new HttpError("Couldn't find this route", 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500).json({
        message: error.message || 'An unknown error occured',
    });
});

//Start server
app.listen(5000);
