require('dotenv').config();
const express = require('express');
const axios = require('axios');
const redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

let redisClient;

(async () => {
    redisClient = redis.createClient();

    redisClient.on('error', (err) => console.error(`Error: ${err}`));

    await redisClient.connect();
})();

async function fetchApiData(country) {
    const apiResponse = await axios.get(
        `${process.env.OPENWEATHERMAP_API_URL}${country}`,
        {
            params: {
                unitGroup: process.env.UNIT_GROUP,
                key: process.env.OPENWEATHERMAP_API_KEY,
                contentType: process.env.CONTENT_TYPE,
            }
        }
    );

    console.log('Request sent to the API');
    return apiResponse.data;
}

async function cacheData(req, res, next) {
    const country = req.params.country;
    let weather;

    try {
        const cacheResults = await redisClient.get(country);
        if (cacheResults) {
            weather = JSON.parse(cacheResults);
            res.send({
                fromCache: true,
                data: weather,
            });
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(404);
    }
}

async function getWeatherData(req, res) {
    const country = req.params.country;
    let weather;

    try {
        weather = await fetchApiData(country);

        if (weather.length === 0) {
            throw "API returned empty weather data";
        }

        await redisClient.set(country, JSON.stringify(weather), {
            EX: 60,
            NX: true,
        });

        res.send({
            fromCache: false,
            data: weather,
        });
    } catch (err) {
        console.error(err);
        res.status(404).send('Data not found');
    }
}

app.get('/weather/:country', cacheData, getWeatherData);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})