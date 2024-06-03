const jwt = require('jsonwebtoken');
const SECRET_KEY = 'W!C@N#M$D%N^G&S*B';

function authenticateToken(req, res, next) {
    // console.log(req);
    if (!req) {
        return res.send({ code: 1001, message: 'No token provided' });
    }
    const [authPrefix, token] = req.headers.authorization?.split(' ') || [];
    if(authPrefix === 'Bearer') {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.send({ code: 2002, message: 'Failed to authenticate token' });
            }
            req.user = user;
            next();
        });
    }
}

module.exports = authenticateToken;
