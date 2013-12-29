path = require("path");

module.exports = {
    Server: {
        port: 3000,
        useErrorHandler: true
    },
    Models: {
        dir: path.join(__dirname, '..', 'src', 'models')
    }   
}