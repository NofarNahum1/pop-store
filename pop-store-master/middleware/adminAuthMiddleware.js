const jwt = require('jsonwebtoken');

function verifyAdminToken(req, res, next) {
    const token = req.cookies.adminToken || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.redirect('/admin-login.html');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err || !decoded.isAdmin) {
            return res.redirect('/admin-login.html');
        }
        req.user = decoded;
        next();
    });
}

module.exports = verifyAdminToken;
