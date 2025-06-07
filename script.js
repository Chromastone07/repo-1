const apiKey = 'b4171211ac30a3c2babf1893383fb653'; // Your API Key

async function searchWeather() {
    const city = document.getElementById('search-input').value.trim();
    const resultDiv = document.getElementById('weather-result');

    if (!city) {
        resultDiv.classList.remove('hidden'); // Show result div to display message
        resultDiv.innerHTML = `<p class="error-message">Please enter a city name.</p>`;
        return;
    }

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
    // AQI URL - requires a different endpoint
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid=${apiKey}`;

    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        if (currentData.cod !== 200 || forecastData.cod !== "200") {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<p class="error-message">City not found. Please check the spelling.</p>`;
            return;
        }

        const lat = currentData.coord.lat;
        const lon = currentData.coord.lon;

        let aqiHtml = '<p id="aqi">🌫️ Air Quality: N/A</p>';
        try {
            const aqiRes = await fetch(aqiUrl.replace('{lat}', lat).replace('{lon}', lon));
            const aqiData = await aqiRes.json();
            if (aqiData.list && aqiData.list.length > 0) {
                const aqiValue = aqiData.list[0].main.aqi;
                const aqiDescription = getAqiDescription(aqiValue);
                aqiHtml = `<p id="aqi">🌫️ Air Quality: <strong>${aqiValue} (${aqiDescription})</strong></p>`;
            }
        } catch (aqiErr) {
            console.error("AQI fetch error:", aqiErr);
            // Fallback to N/A if AQI fails
        }

        const forecastHTML = get5DayForecastHTML(forecastData);

        resultDiv.classList.remove('hidden'); // Ensure it's visible
        resultDiv.innerHTML = `
            <h2 id="cityName">${currentData.name}, ${currentData.sys.country}</h2>
            <img id="weatherIcon" src="https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="${currentData.weather[0].description}">
            <p id="temperature">${Math.round(currentData.main.temp)}°C</p>
            <p id="description">${currentData.weather[0].description}</p>
            <p id="humidity">Humidity: ${currentData.main.humidity}%</p>
            <p id="wind">Wind Speed: ${currentData.wind.speed} m/s</p>
            ${aqiHtml}
            <h3 class="forecast-title">5-Day Forecast:</h3>
            <div class="forecast-grid">
                ${forecastHTML}
            </div>
        `;
    } catch (err) {
        console.error("Weather fetch error:", err);
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<p class="error-message">Something went wrong. Please try again later.</p>`;
    }
}

function getAqiDescription(aqi) {
    switch(aqi) {
        case 1: return "Good";
        case 2: return "Fair";
        case 3: return "Moderate";
        case 4: return "Poor";
        case 5: return "Very Poor";
        default: return "Unknown";
    }
}

function get5DayForecastHTML(data) {
    const forecastByDay = {};

    // Group forecast entries by date, considering unique dates for 5 days
    data.list.forEach(entry => {
        const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!forecastByDay[date]) {
            forecastByDay[date] = entry; // Just take the first entry for each day (e.g., midday)
        }
    });

    const forecastDays = Object.values(forecastByDay).slice(0, 5); // Get up to 5 unique days

    return forecastDays.map(entry => {
        const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        const temp = Math.round(entry.main.temp);
        const icon = entry.weather[0].icon;
        const desc = entry.weather[0].description;

        return `
            <div class="forecast-day">
                <span class="forecast-date">${date}</span>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" class="forecast-icon">
                <span class="forecast-temp">${temp}°C</span>
                <span class="forecast-desc">${desc}</span>
            </div>
        `;
    }).join('');
}

