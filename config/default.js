path = require("path");

module.exports = {
    Server: {
        port: 3001,
        useErrorHandler: true
    },
    Models: {
        dir: path.join(__dirname, '..', 'src', 'models')
    }   
}
