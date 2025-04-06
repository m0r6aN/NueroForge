// neuroforge/backend/src/utils/apiError.js
// Purpose: Custom error class for API responses
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Flag for operational errors (vs programming errors)

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;