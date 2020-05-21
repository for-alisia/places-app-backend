const mongoose = require('mongoose');
//Create a new mongoose schema (it's a class)
const Schema = mongoose.Schema;
//Create an instance of this class for handling places collection
const placeSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }, //ref points to a mongoose model, which handles related documents
});
//Export new Place model, that using created schema
module.exports = mongoose.model('Place', placeSchema);
