
/* ==========================================
   SKYCAST PRO
   REAL WEATHER USING OPEN-METEO
   NO API KEY REQUIRED
========================================== */

// 1. API URLS

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";


// 2. HTML ELEMENTS

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");

const dashboard = document.getElementById("weather-dashboard");
const emptyState = document.getElementById("empty-state");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error-box");
const errorText = document.getElementById("error-text");

const locationButton = document.getElementById("location-btn");
const refreshButton = document.getElementById("refresh-btn");

let lastLocation = null;


// 3. SYSTEM CLOCK

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("en-IN");

    document.getElementById("today-date").textContent =
        now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

}

updateClock();
setInterval(updateClock, 1000);


// 4. FOOTER YEAR

document.getElementById("year").textContent =
    new Date().getFullYear();


// 5. WEATHER CODE CONVERSION

function getWeatherInfo(code, isDay = 1) {

    const conditions = {

        0: ["Clear sky", isDay ? "01d" : "01n", "☀️"],
        1: ["Mainly clear", isDay ? "01d" : "01n", "🌤️"],
        2: ["Partly cloudy", isDay ? "02d" : "02n", "⛅"],
        3: ["Overcast", isDay ? "04d" : "04n", "☁️"],

        45: ["Fog", "50d", "🌫️"],
        48: ["Depositing rime fog", "50d", "🌫️"],

        51: ["Light drizzle", "09d", "🌦️"],
        53: ["Moderate drizzle", "09d", "🌦️"],
        55: ["Dense drizzle", "09d", "🌧️"],

        56: ["Freezing drizzle", "09d", "🌧️"],
        57: ["Heavy freezing drizzle", "09d", "🌧️"],

        61: ["Slight rain", "10d", "🌧️"],
        63: ["Moderate rain", "10d", "🌧️"],
        65: ["Heavy rain", "10d", "🌧️"],

        66: ["Freezing rain", "13d", "🌨️"],
        67: ["Heavy freezing rain", "13d", "🌨️"],

        71: ["Slight snowfall", "13d", "🌨️"],
        73: ["Moderate snowfall", "13d", "❄️"],
        75: ["Heavy snowfall", "13d", "❄️"],
        77: ["Snow grains", "13d", "❄️"],

        80: ["Rain showers", "09d", "🌦️"],
        81: ["Moderate rain showers", "09d", "🌧️"],
        82: ["Violent rain showers", "09d", "⛈️"],

        85: ["Snow showers", "13d", "🌨️"],
        86: ["Heavy snow showers", "13d", "❄️"],

        95: ["Thunderstorm", "11d", "⛈️"],
        96: ["Thunderstorm with hail", "11d", "⛈️"],
        99: ["Heavy thunderstorm", "11d", "⛈️"]

    };

    return conditions[code] ||
        ["Unknown weather", "03d", "🌤️"];

}


// 6. SEARCH CITY

searchForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    await searchCity(city);

});


// 7. GEOCODING API

async function searchCity(city) {

    showLoading(true);

    try {

        const url =
            `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to connect to location service.");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("City not found. Try another city name.");
        }

        const place = data.results[0];

        const location = {
            name: place.name,
            country: place.country || "",
            latitude: place.latitude,
            longitude: place.longitude
        };

        await loadWeather(location);

    }

    catch(error) {

        showError(error.message);

    }

    finally {

        showLoading(false);

    }

}


// 8. FETCH REAL WEATHER

async function loadWeather(location) {

    const params = new URLSearchParams({

        latitude: location.latitude,
        longitude: location.longitude,

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "surface_pressure",
            "visibility"
        ].join(","),

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset"
        ].join(","),

        forecast_days: "5",
        timezone: "auto",
        wind_speed_unit: "ms"

    });

    const response = await fetch(
        `${WEATHER_URL}?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error("Weather service is temporarily unavailable.");
    }

    const data = await response.json();

    if (!data.current || !data.daily) {
        throw new Error("Weather information is unavailable for this location.");
    }

    lastLocation = location;

    displayCurrentWeather(data, location);

    displayForecast(data);

    updateWeatherArt(
        data.current.weather_code,
        data.current.is_day
    );

    dashboard.hidden = false;
    emptyState.hidden = true;
    errorBox.hidden = true;

    document.getElementById("update-time").textContent =
        "Last synchronized: " +
        new Date().toLocaleTimeString();

}


// 9. DISPLAY CURRENT WEATHER

function displayCurrentWeather(data, location) {

    const current = data.current;

    const temp = Math.round(current.temperature_2m);

    const feels = Math.round(current.apparent_temperature);

    const weather = getWeatherInfo(
        current.weather_code,
        current.is_day
    );

    // Location

    document.getElementById("city-name").textContent =
        `${location.name}, ${location.country}`;

    document.getElementById("weather-country").textContent =
        `${location.name} • ${location.country}`;

    // Date

    const today = data.daily.time[0];

    const date = new Date(today + "T12:00:00");

    document.getElementById("weather-date").textContent =
        date.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    // Temperature

    document.getElementById("temperature").textContent =
        `${temp}°`;

    document.getElementById("feels-like").textContent =
        `${feels}°C`;

    // Weather description

    document.getElementById("weather-description").textContent =
        weather[0];

    document.getElementById("condition-title").textContent =
        weather[0];

    // Weather icon

    const weatherIcon = document.getElementById("weather-icon");

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${weather[1]}@2x.png`;

    weatherIcon.alt = weather[0];

    weatherIcon.style.display = "block";

    // Humidity

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    // Wind speed

    document.getElementById("wind").textContent =
        `${current.wind_speed_10m} m/s`;

    // Visibility

    document.getElementById("visibility").textContent =
        `${(current.visibility / 1000).toFixed(1)} km`;

    // Pressure

    document.getElementById("pressure").textContent =
        `${Math.round(current.surface_pressure)} hPa`;

    // Sunrise and sunset

    document.getElementById("sunrise").textContent =
        formatTime(data.daily.sunrise[0]);

    document.getElementById("sunset").textContent =
        formatTime(data.daily.sunset[0]);

}


// 10. FORMAT TIME

function formatTime(dateTime) {

    if (!dateTime) return "--:--";

    return dateTime.split("T")[1].slice(0, 5);

}


// 11. FIVE-DAY FORECAST

function displayForecast(data) {

    const grid = document.getElementById("forecast-grid");

    grid.innerHTML = "";

    const daily = data.daily;

    daily.time.forEach((dateString, index) => {

        const date = new Date(dateString + "T12:00:00");

        const dayName = index === 0
            ? "Today"
            : date.toLocaleDateString("en-IN", {
                weekday: "short"
            });

        const weather = getWeatherInfo(
            daily.weather_code[index]
        );

        const maxTemp = Math.round(
            daily.temperature_2m_max[index]
        );

        const minTemp = Math.round(
            daily.temperature_2m_min[index]
        );

        // Forecast card

        const card = document.createElement("div");

        card.className = "forecast-card";

        const heading = document.createElement("h3");

        heading.textContent = dayName;

        const image = document.createElement("img");

        image.src =
            `https://openweathermap.org/img/wn/${weather[1]}@2x.png`;

        image.alt = weather[0];

        const description = document.createElement("p");

        description.textContent = weather[0];

        const temperature = document.createElement("div");

        temperature.className = "forecast-temp";

        const high = document.createElement("strong");

        high.textContent = `${maxTemp}°`;

        const low = document.createElement("span");

        low.textContent = `${minTemp}°`;

        temperature.append(high, low);

        card.append(
            heading,
            image,
            description,
            temperature
        );

        grid.appendChild(card);

    });

}


// 12. DYNAMIC WEATHER ART

function updateWeatherArt(code, isDay) {

    const weather = getWeatherInfo(code, isDay);

    const artSun = document.querySelector(".art-sun");

    const artCloud = document.querySelector(".art-cloud");

    const glow = document.querySelector(".art-glow");

    const rainy = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];

    const snowy = [71,73,75,77,85,86];

    if (!isDay) {

        artSun.textContent = "☾";
        artSun.style.color = "#c3d4ff";
        artSun.style.display = "block";

        artCloud.textContent = "☁";

    }

    else if (rainy.includes(code)) {

        artSun.style.display = "none";

        artCloud.textContent = "🌧️";

    }

    else if (snowy.includes(code)) {

        artSun.style.display = "none";

        artCloud.textContent = "❄️";

    }

    else if (code === 0 || code === 1) {

        artSun.style.display = "block";
        artSun.textContent = "☀";
        artSun.style.color = "#ffcc69";

        artCloud.textContent = "☁";

    }

    else {

        artSun.style.display = "none";

        artCloud.textContent = "☁";

    }

    glow.style.background =
        "radial-gradient(circle, rgba(69,217,245,.24), transparent 70%)";

}


// 13. LOADING

function showLoading(active) {

    loading.hidden = !active;

    searchButton.disabled = active;

    locationButton.disabled = active;

    searchButton.innerHTML = active
        ? "Loading..."
        : 'Explore Weather <span>→</span>';

    if (active) {

        errorBox.hidden = true;
        dashboard.hidden = true;
        emptyState.hidden = true;

    }

}


// 14. ERROR HANDLING

function showError(message) {

    errorText.textContent = message;

    errorBox.hidden = false;

    dashboard.hidden = true;

    emptyState.hidden = true;

}


// 15. POPULAR CITY BUTTONS

document.querySelectorAll(".city-chip").forEach(button => {

    button.addEventListener("click", function() {

        const city = this.dataset.city;

        cityInput.value = city;

        searchCity(city);

    });

});


// 16. CURRENT LOCATION

locationButton.addEventListener("click", function() {

    if (!navigator.geolocation) {

        showError("Geolocation is not supported by your browser.");

        return;

    }

    showLoading(true);

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            try {

                const location = {
                    name: "Your Location",
                    country: "",
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                await loadWeather(location);

            }

            catch(error) {

                showError(error.message);

            }

            finally {

                showLoading(false);

            }

        },

        function(error) {

            showLoading(false);

            const messages = {
                1: "Location permission denied. Please allow location access.",
                2: "Unable to detect your location.",
                3: "Location request timed out. Try again."
            };

            showError(
                messages[error.code] || "Location unavailable."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
        }

    );

});


// 17. REFRESH WEATHER

refreshButton.addEventListener("click", async function() {

    if (!lastLocation) return;

    showLoading(true);

    try {

        await loadWeather(lastLocation);

    }

    catch(error) {

        showError(error.message);

    }

    finally {

        showLoading(false);

    }

});


// 18. INITIAL SCREEN

dashboard.hidden = true;
errorBox.hidden = true;
loading.hidden = true;
emptyState.hidden = false;
