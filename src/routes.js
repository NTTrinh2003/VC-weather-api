const { Router } = require('express');

const controller = require('./controller');
const router = Router();

router.get('/hello', controller.getHello);

module.exports = router;