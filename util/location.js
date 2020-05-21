const axios = require('axios');

const HttpError = require('../models/http-error');

const { GOOGLE_API_KEY } = require('../config');

const getCoordsForAddress = async (address) => {
    const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
        )}&key=${GOOGLE_API_KEY}`
    );

    const data = response.data;
    // TODO: this condition here is incomplete, if your key is invalid it doesn't return an error
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
