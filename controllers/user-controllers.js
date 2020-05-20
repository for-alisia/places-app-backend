const uuid = require('uuid').v4;
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Lina',
        email: 'test@mail.com',
        password: 'test',
    },
    {
        id: 'u2',
        name: 'Jason',
        email: 'test2@mil.com',
        password: 'test2',
    },
];

const getAllUsers = (req, res, next) => {
    res.json({ users: DUMMY_USERS });
};

const createUser = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, check your data', 422)
        );
    }

    const { name, email, password } = req.body;

    const hasUser = DUMMY_USERS.find((u) => u.email === email);

    if (hasUser) {
        return next(
            new HttpError("Couldn't create a user, email already exists", 422)
        );
    }

    const createdUser = {
        id: uuid(),
        name,
        email,
        password,
    };

    DUMMY_USERS.push(createdUser);

    res.status(201).json({ user: createdUser });
};

const loginUser = (req, res, next) => {
    const { email, password } = req.body;

    const user = DUMMY_USERS.find((u) => u.email === email);

    if (!user || user.password !== password) {
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
