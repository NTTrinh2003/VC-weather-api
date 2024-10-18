const express = require('express');
const app = express();
const port = 4000;

// Routers
const route = require('./src/routes.js');
// --------

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, world');
})

app.use('/api/v1/', route);

app.listen(port, () => console.log('listening on port 4000'));