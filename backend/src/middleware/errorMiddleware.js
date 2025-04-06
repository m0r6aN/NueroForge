// neuroforge/backend/src/middleware/errorMiddleware.js
// Purpose: Global error handler for Express
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const config = require('../config');

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ApiError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    // Extract value from error message (regex might need adjustment based on DB driver)
     const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] || 'value';
    // const value = err.keyValue ? Object.values(err.keyValue)[0] : 'value'; // Mongoose >= 6?
    const message = `Duplicate field ${value}. Please use another value!`;
    return new ApiError(message, 400);
};

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new ApiError(message, 400);
};

const handleJWTError = () => new ApiError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new ApiError('Your token has expired! Please log in again.', 401);


const sendErrorDev = (err, res) => {
    logger.error('DEVELOPMENT ERROR:', err);
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    // Programming or other unknown error: don't leak error details
    } else {
        // 1) Log error
        logger.error('PRODUCTION ERROR:', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

module.exports = (err, req, res, next) => {
    let error = { ...err }; // Create a copy
    error.message = err.message; // Ensure message property exists
    error.statusCode = err.statusCode || 500;
    error.status = err.status || 'error';

    // Log the original error structure in development for easier debugging
    if (config.nodeEnv === 'development') {
         logger.debug("Original Error Obj:", err);
    }


    // Handle specific Mongoose errors for production refinement
    if (config.nodeEnv === 'production') {
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.code === 11000 || err.code === 11001) error = handleDuplicateFieldsDB(error); // Mongo duplicate key error
        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
         // Add handlers for SQL errors if needed
    }


    if (config.nodeEnv === 'development') {
        sendErrorDev(error, res);
    } else {
        // Ensure the copied error still inherits from ApiError if it was one initially
        // This is important for the isOperational check
         if (!(error instanceof ApiError) && err instanceof ApiError) {
             error = new ApiError(error.message, error.statusCode);
         } else if (!(error instanceof ApiError)) {
             // If it wasn't an ApiError originally and not transformed into one,
             // mark it as non-operational unless specifically known otherwise
             error.isOperational = false;
         }
        sendErrorProd(error, res);
    }
};