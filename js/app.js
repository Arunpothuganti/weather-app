// STEP 1: turn weather codes (from the Open-Meteo docs) into words and a color mood
function describe(code) {
  if (code === 0) return ["Clear sky", "sunny"];
  if (code <= 3) return ["Partly cloudy", "cloudy"];
  if (code <= 48) return ["Fog", "cloudy"];
  if (code <= 67) return ["Rain", "rainy"];
  if (code <= 77) return ["Snow", "snowy"];
  if (code <= 82) return ["Showers", "rainy"];
  if (code <= 86) return ["Snow showers", "snowy"];
  return ["Thunderstorm", "stormy"];
}

// STEP 2: find the city's coordinates (geocoding)
async function findCity(name) {
  const url = "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" +
              encodeURIComponent(name);
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results) throw new Error("No city found. Check the spelling.");
  return data.results[0];
}

// STEP 3: get the forecast for those coordinates
async function getForecast(lat, lon) {
  const url = "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + lat + "&longitude=" + lon +
    "&current=temperature_2m,weather_code" +
    "&daily=temperature_2m_max,temperature_2m_min,weather_code" +
    "&timezone=auto&forecast_days=5";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather service is unavailable.");
  return res.json();
}

// STEP 4: put the data on the page
function show(city, w) {
  const [text, mood] = describe(w.current.weather_code);
  document.body.className = mood; // swaps the color theme
  document.getElementById("temp").textContent = Math.round(w.current.temperature_2m) + "°";
  document.getElementById("desc").textContent = text;
  document.getElementById("place").textContent =
    city.name + (city.country ? ", " + city.country : "");

  const list = document.getElementById("days");
  list.innerHTML = "";
  w.daily.time.forEach((date, i) => {
    const day = new Date(date + "T12:00").toLocaleDateString(undefined, { weekday: "long" });
    const li = document.createElement("li");
    li.textContent = day + " · " + describe(w.daily.weather_code[i])[0];
    const range = document.createElement("span");
    range.textContent = Math.round(w.daily.temperature_2m_min[i]) + "° / " +
                        Math.round(w.daily.temperature_2m_max[i]) + "°";
    li.appendChild(range);
    list.appendChild(li);
  });
  document.getElementById("result").hidden = false;
}

// STEP 5: connect everything to the search form
document.getElementById("search").addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading
  const status = document.getElementById("status");
  status.textContent = "Loading…";
  try {
    const city = await findCity(document.getElementById("city").value);
    const weather = await getForecast(city.latitude, city.longitude);
    show(city, weather);
    status.textContent = "";
  } catch (err) {
    status.textContent = err.message; // tell the user what went wrong
  }
});
