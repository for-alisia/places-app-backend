const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization;

    if (!token) {
      throw new Error();
    }

    const decodedToken = jwt.verify(token, 'supersecret_dont_share');

    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError('Authentication failed!', 403));
  }
};
