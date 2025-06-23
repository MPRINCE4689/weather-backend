const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/weatherDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define a schema for weather queries (city and date, plus temperature)
const querySchema = new mongoose.Schema({
  city: String,
  date: { type: Date, default: Date.now },
  temperature: Number
});


const Query = mongoose.model('Query', querySchema);



// Basic test route
app.get('/', (req, res) => {
  res.send('Hello, world! The API is running.');
});

app.get('/weather', async (req, res) => {
  const city = req.query.city;  // get city from query parameter
  if (!city) {
    return res.status(400).send({ error: "Please provide a city query parameter, e.g. /weather?city=London" });
  }
  const apiKey = 'c235121fa8fc6bf25a0af91143011bcb';
  const url = `http://api.weatherstack.com/current?access_key=${apiKey}&query=${encodeURIComponent(city)}`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    // If the API returns an error (e.g., invalid city or missing API key), it will be in data.error
    if (data.error) {
      return res.status(500).send({ error: data.error.info || "Failed to get weather data" });
    }

  // Save the query to the database
     const temp = data.current?.temperature;  // current temperature from API (if available)
     const newEntry = new Query({ city: city, temperature: temp });
     newEntry.save().catch(err => console.error("DB save error:", err));


    // For simplicity, respond with the full data from Weatherstack
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Unable to fetch weather information" });
  }
});

app.get('/weather/history', async (req, res) => {
  try {
    const queries = await Query.find().sort({ date: -1 });
    res.send(queries);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to retrieve history" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
