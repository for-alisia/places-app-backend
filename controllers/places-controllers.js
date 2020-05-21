const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(
            new HttpError("Couldn't find a place in the database", 500)
        );
    }

    if (!place) {
        return next(
            new HttpError("Couldn't find a place for the provided id", 404)
        );
    }

    res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let places;

    try {
        places = await Place.find({ creator: userId });
    } catch (err) {
        return next(
            new HttpError(
                "Couldn't retrieve data from database, try again",
                500
            )
        );
    }

    if (places.length === 0) {
        return next(
            new HttpError("Couldn't find places for the provided user id", 404)
        );
    }

    res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, check your data', 422)
        );
    }

    const { title, description, address, creator } = req.body;
    let coordinates;

    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Angular_full_color_logo.svg/250px-Angular_full_color_logo.svg.png',
        creator,
    });

    try {
        await createdPlace.save();
    } catch (err) {
        return next(
            new HttpError('Creating place failed, please try again', 500)
        );
    }

    res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, check your data', 422)
        );
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;
    let updatedPlace;

    try {
        updatedPlace = await Place.findById(placeId);
    } catch (err) {
        return next(
            new HttpError('Updating place failed, please try again', 500)
        );
    }

    updatedPlace.title = title;
    updatedPlace.description = description;

    try {
        await updatedPlace.save();
    } catch (err) {
        return next(
            new HttpError('Updating place failed, please try again', 500)
        );
    }

    res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(
            new HttpError('Deleting place failed, please try again', 500)
        );
    }

    try {
        await place.remove();
    } catch (err) {
        return next(
            new HttpError('Deleting place failed, please try again', 500)
        );
    }

    res.status(200).json({ message: 'Deleted successfully' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
