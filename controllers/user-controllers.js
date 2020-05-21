const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getAllUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        return next(new HttpError('Fetching users failed', 500));
    }

    res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

const createUser = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, check your data', 422)
        );
    }

    const { name, email, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        return next(new HttpError("Couldn't create a user, try again", 500));
    }

    if (existingUser) {
        return next(
            new HttpError('User is already exists, please login instead', 422)
        );
    }

    const createdUser = new User({
        name,
        email,
        image:
            'https://images.unsplash.com/photo-1506919258185-6078bba55d2a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1030&q=80',
        password,
        places: [],
    });

    try {
        await createdUser.save();
    } catch (err) {
        return next(
            new HttpError('Creating user failed, please try again', 500)
        );
    }

    res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        return next(new HttpError('Login failed, try again', 500));
    }

    if (!existingUser || existingUser.password !== password) {
        return next(
            new HttpError(
                "Couldn't find a user with the provided credentials",
                401
            )
        );
    }

    res.json({ message: 'Logged in' });
};

exports.getAllUsers = getAllUsers;
exports.createUser = createUser;
exports.loginUser = loginUser;
