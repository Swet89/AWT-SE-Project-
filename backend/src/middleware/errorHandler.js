function notFound(req, res, next) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.publicMessage || 'Something went wrong on our end. Please try again.',
  });
}

module.exports = { notFound, errorHandler };
