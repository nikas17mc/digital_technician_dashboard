export function errorHandler(err, req, res, next) {
    const status = err.statusCode || 500;

    const role =
        req.user && req.user.role
            ? req.user.role
            : 'guest';

    const requestId =
        req.id
            ? req.id
            : 'n/a';

    res.status(status);

    res.render('errors/error', {
        statusCode: status,
        message: err.message,
        error: err,
        requestId,
        env: process.env.NODE_ENV,
        role
    });
}
