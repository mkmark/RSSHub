module.exports = function (router) {
    router.get('/hub/:section', require('./index'));
};
