const { errorResponse } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('[Error Details]:', err);

  // Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return errorResponse(res, 404, message);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    return errorResponse(res, 400, message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 400, 'Validation failed', message);
  }

  return errorResponse(
    res,
    error.statusCode || 500,
    error.message || 'Internal Server Error'
  );
};

module.exports = errorHandler;