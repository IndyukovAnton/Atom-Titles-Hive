const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('----------------------------------------------------');
console.log('Generated JWT Secret:');
console.log(secret);
console.log('----------------------------------------------------');
console.log('Copy this value to your .env file as JWT_SECRET');
