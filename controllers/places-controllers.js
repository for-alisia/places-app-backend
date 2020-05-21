const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

// Get Place by Id (/places/:id, GET)
const getPlaceById = async (req, res, next) => {
    //Get place id by request params
    const placeId = req.params.pid;
    let place;
    //Send a request to a DB to find a place by ID
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(
            new HttpError("Couldn't find a place in the database", 500)
        );
    }
    //If there are not such place in DB, handle the error
    if (!place) {
        return next(
            new HttpError("Couldn't find a place for the provided id", 404)
        );
    }

    res.json({ place: place.toObject({ getters: true }) });
};
// Get places, related to the user (/places/user/:uid, GET)
const getPlacesByUserId = async (req, res, next) => {
    //Get user ID from request params
    const userId = req.params.uid;
    let places;
    //Send request to DB to find all places, created by user
    try {
        places = await Place.find({ creator: userId }); //If we pass an object argument, it will work, like a filter
    } catch (err) {
        return next(
            new HttpError(
                "Couldn't retrieve data from database, try again",
                500
            )
        );
    }
    //If user didn't create at least one place, this array will be empty and we handle an error
    if (places.length === 0) {
        return next(
            new HttpError("Couldn't find places for the provided user id", 404)
        );
    }
    //Send a response with user's places (array, so we use map-function to convert each element to a JS object)
    res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

// Create new place (/places, POST)
const createPlace = async (req, res, next) => {
    //Validate user's inputs
    const errors = validationResult(req);
    //Handling errors, if inputs are incorrect
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, check your data', 422)
        );
    }
    //Get data from request body
    const { title, description, address, creator } = req.body;
    let coordinates;
    //Get coordinates by address, using Google Geocoder (util/location)
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }
    //Create new mongoose object for new place
    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Angular_full_color_logo.svg/250px-Angular_full_color_logo.svg.png',
        creator,
    });

    let user;
    //Check, if the user with this id is exists in DB
    try {
        user = await User.findById(creator);
    } catch (err) {
        return next(new HttpError('Connection failed', 500));
    }
    //Handle error, if we couldn't find a user with provided id
    if (!user) {
        return next(
            new HttpError('We can not find a user with the provided ID', 404)
        );
    }

    try {
        //Create session (if one of this requested fails, another fails too)
        //Save a created place in DB and add the pointer to this place to user's places array
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace); //Mongoose handles adding just ObjectId from provided object to DB by itself
        await user.save({ session: sess });
        await sess.commitTransaction(); //We need to close a transaction
    } catch (err) {
        return next(
            new HttpError('Creating place failed, please try again', 500)
        );
    }
    //Send a response with a created place
    res.status(201).json({ place: createdPlace });
};

// Update place (/places/:pid, PATCH)
const updatePlace = async (req, res, next) => {
    //Check users inputs
    const errors = validationResult(req);
    //Handling error, if we got incorrect data
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, check your data', 422)
        );
    }
    //Get data from user (using body) and place ID from request params
    const { title, description } = req.body;
    const placeId = req.params.pid;
    let updatedPlace;

    //Send request to DB to find a place
    try {
        updatedPlace = await Place.findById(placeId);
    } catch (err) {
        return next(
            new HttpError('Updating place failed, please try again', 500)
        );
    }
    //Update place object with new data
    updatedPlace.title = title;
    updatedPlace.description = description;

    //Send request to DB to update a place (just save to create and update)
    try {
        await updatedPlace.save();
    } catch (err) {
        return next(
            new HttpError('Updating place failed, please try again', 500)
        );
    }
    //Send a response with updated place (toObject convert mongoose object to a common JS object, getters give an id field to an object)
    res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

// Delete place (/places/:pid, DELETE)
const deletePlace = async (req, res, next) => {
    //Get place id from request params
    const placeId = req.params.pid;
    let place;
    // Make a request to DB to find a place by ID
    try {
        //populate return related user to this place (we can interract with this object using place.creator)
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        console.log(err);
        return next(new HttpError('Cant reach place, please try again', 500));
    }
    // Return error, if place wasn't found
    if (!place) {
        return next(
            new HttpError('There are no place with the provided ID', 404)
        );
    }
    //Open session to delete place and update user's places array
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        console.log(err);
        return next(
            new HttpError('Deleting place failed, please try again', 500)
        );
    }
    //Return the response
    res.status(200).json({ message: 'Deleted successfully' });
};

//Exports
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
