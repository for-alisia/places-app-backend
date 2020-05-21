const axios = require('axios');

const HttpError = require('../models/http-error');

const API_KEY = 'AIzaSyClrn5Sq3R5ZU3OYMSKS08Q0l8MjRUkqLs';

const getCoordsForAddress = async (address) => {
    const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
        )}&key=${API_KEY}`
    );

    const data = response.data;

    if (!data || data.status === 'ZERO_RESULTS') {
        const error = new HttpError(
            "Couldn't find a location for a provided address",
            422
        );
        throw error;
    }

    const coordinates = data.results[0].geometry.location;

    return coordinates;
};

module.exports = getCoordsForAddress;
