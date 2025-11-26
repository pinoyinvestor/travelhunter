import React, { useEffect, useState } from "react";
import { DESTINATIONS } from "./data/destinations";
import { FollowsProvider, useFollows } from "./context/FollowsContext";
import { buildAISummary, planBestRoute } from "./utils/tripAi";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

// dagens datum i format YYYY-MM-DD
const TODAY_STR = new Date().toISOString().split("T")[0];

const START_CITIES = [
  { id: "manila", name: "Manila" },
  { id: "cebu", name: "Cebu" },
  { id: "davao", name: "Davao" },
  { id: "clark", name: "Clark" }
];

// koppling från val i select → IATA-kod
const ORIGIN_IATA = {
  manila: "MNL",
  cebu: "CEB",
  davao: "DVO",
  clark: "CRK"
};

const WEEKDAYS_SHORT = ["Sön", "Mån", "Tis", "Ons", "Tors", "Fre", "Lör"];

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = WEEKDAYS_SHORT[d.getDay()];
  const dayNum = d.getDate();
  const month = d.getMonth() + 1;
  return `${day} ${dayNum}/${month}`;
}

function formatUpdatedTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// AI-lik analys av vädret (sammanfattning)
function getWeatherAnalysis(daily, daysToUse, hourly) {
  if (!daily || !daily.temperature_2m_max || daily.temperature_2m_max.length === 0) {
    return {
      label: "Ingen prognos",
      emoji: "ℹ️",
      title: "Ingen väderprognos",
      message: "Det finns ingen prognos för dessa datum."
    };
  }

  const actualDays = Math.min(
    daysToUse,
    daily.temperature_2m_max.length,
    daily.precipitation_sum.length
  );

  let totalTemp = 0;
  let totalRain = 0;
  let sunnyDays = 0;
  let rainyDays = 0;
  let totalCloud = 0;
  let cloudHours = 0;

  for (let i = 0; i < actualDays; i++) {
    const t = daily.temperature_2m_max[i];
    const p = daily.precipitation_sum[i];

    totalTemp += t;
    totalRain += p;

    if (p < 2 && t >= 28 && t <= 33) sunnyDays++;
    if (p > 10) rainyDays++;
  }

  // moln (timvis)
  if (hourly && hourly.cloudcover && hourly.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      const dateStr = hourly.time[i].split("T")[0];
      const withinDays = daily.time.includes(dateStr);
      if (!withinDays) continue;

      totalCloud += hourly.cloudcover[i];
      cloudHours++;
    }
  }

  const avgTemp = totalTemp / actualDays;
  const avgRain = totalRain / actualDays;
  const avgCloud = cloudHours ? totalCloud / cloudHours : 50;

  if (avgCloud >= 70 && avgRain < 2) {
    return {
      label: "Molnigt men torrt",
      emoji: "🌥️",
      title: "Molnigare dagar",
      message: `Mestadels molnigt men nästan inget regn. Ca ${avgTemp.toFixed(
        1
      )}°C i snitt.`
    };
  }

  if (sunnyDays >= actualDays - 1 && avgRain < 2 && avgCloud < 40) {
    return {
      label: "Sol-säkert",
      emoji: "☀️",
      title: "Sol-säkert äventyr",
      message: `Nästan bara sol under perioden (≈ ${avgTemp.toFixed(
        1
      )}°C). Perfekt för strand, ö-hoppning och fotosessioner.`
    };
  }

  if (sunnyDays >= Math.floor(actualDays / 2) && avgRain < 6) {
    return {
      label: "Mestadels bra",
      emoji: "⛅",
      title: "Mestadels bra väder",
      message:
        "En mix av sol och flera torrperioder, men med några regnskurar. Funkar för både utflykter och chill."
    };
  }

  if (avgRain >= 8 || rainyDays >= Math.floor(actualDays / 2)) {
    return {
      label: "Regnigare period",
      emoji: "🌧️",
      title: "Regnigare period",
      message:
        "Ganska mycket regn i prognosen. Bättre om ni tänkt dyka, chilla eller inte är superväderkänsliga."
    };
  }

  return {
    label: "Okej väder",
    emoji: "🌤️",
    title: "Okej väder",
    message:
      "Vädret ser helt okej ut – inte super-soligt men heller inte dåligt. En bra allround-period."
  };
}

// Score-funktion: väder + preferenser (ingen budget längre)
// Nu väger vi in: nederbörd, vind, moln, regn-sannolikhet & UV (sol)
function computeScores(
  daily,
  daysToUse,
  dest,
  activePrefs,
  preference, // "weather" | "sun"
  avgCloud // 0–100, genomsnittlig molnighet
) {
  if (
    !daily ||
    !daily.temperature_2m_max ||
    daily.temperature_2m_max.length === 0
  ) {
    return {
      weatherScore: 0,
      preferenceScore: 0,
      totalScore: 0,
      matchPercent: 0
    };
  }

  const actualDays = Math.min(
    daysToUse,
    daily.temperature_2m_max.length,
    daily.precipitation_sum.length,
    daily.windspeed_10m_max.length
  );

  let weatherTotal = 0;

  for (let i = 0; i < actualDays; i++) {
    const t = daily.temperature_2m_max[i];
    const p = daily.precipitation_sum[i];
    const w = daily.windspeed_10m_max[i];
    const prob =
      daily.precipitation_probability_mean?.[i] != null
        ? daily.precipitation_probability_mean[i]
        : 50;
    const uv =
      daily.uv_index_max?.[i] != null ? daily.uv_index_max[i] : 7;

    let score = 0;

    // temp (30-ish är sweetspot)
    if (t >= 27 && t <= 33) score += 3;
    else if (t >= 25 && t < 27) score += 2;
    else if (t > 33 && t <= 35) score += 1;

    // nederbörd
    if (p < 3) score += 4;
    else if (p < 8) score += 2;
    else if (p > 15) score -= 2;

    // vind
    if (w <= 25) score += 2;
    else if (w > 40) score -= 1;

    // regn-sannolikhet
    if (prob < 20) score += 1.5;
    else if (prob > 70) score -= 2;

    // UV – proxy för sol, men för starkt kan vara jobbigt
    if (uv >= 7 && uv <= 10) score += 1;
    else if (uv <= 3) score -= 1;

    weatherTotal += score;
  }

  const weatherScore = weatherTotal / actualDays;

  // preferenser baserat på tags
  let preferenceBonus = 0;

  const hasTag = (tagName) =>
    dest.tags.some((t) => t.toLowerCase().includes(tagName.toLowerCase()));

  for (const pref of activePrefs) {
    if (pref === "sun") {
      let sunBoost = weatherScore * 0.3;
      if (typeof avgCloud === "number") {
        if (avgCloud < 40) {
          sunBoost += 2; // riktigt soligt
        } else if (avgCloud > 70) {
          sunBoost -= 2; // väldigt molnigt
        }
      }
      preferenceBonus += sunBoost;
    }

    if (pref === "party" && hasTag("nightlife")) {
      preferenceBonus += 2;
    }
    if (pref === "diving" && hasTag("dykning")) {
      preferenceBonus += 2;
    }
    if (pref === "surf" && hasTag("surf")) {
      preferenceBonus += 2;
    }
    if (pref === "chill" && (hasTag("chill") || hasTag("lugn"))) {
      preferenceBonus += 2;
    }
  }

  // Vikt baserat på grund-prioritering
  let weatherWeight = 1;
  let extraSunBoost = 0;

  if (preference === "weather") {
    weatherWeight = 1.2;
  } else if (preference === "sun") {
    // global soljakt: premiera mindre moln extra
    if (typeof avgCloud === "number") {
      if (avgCloud < 40) extraSunBoost += 2.5;
      else if (avgCloud < 60) extraSunBoost += 1;
      else if (avgCloud > 75) extraSunBoost -= 1.5;
    }
  }

  const preferenceScore = preferenceBonus + extraSunBoost;
  const totalScore = weatherScore * weatherWeight + preferenceScore;

  const maxPossible = 24; // uppdaterad ungefärlig max-score
  const matchPercent = Math.max(
    0,
    Math.min(100, Math.round((totalScore / maxPossible) * 100))
  );

  return {
    weatherScore,
    preferenceScore,
    totalScore,
    matchPercent
  };
}

function InnerApp() {
  const [screen, setScreen] = useState("splash"); // splash | home | filters | results | followed

  const [startCity, setStartCity] = useState("manila");
  const [useGps, setUseGps] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [days, setDays] = useState(4);
  const [startDate, setStartDate] = useState(TODAY_STR);

  const [preference, setPreference] = useState("weather"); // weather | sun

  const [preferences, setPreferences] = useState({
    sun: true,
    party: false,
    diving: false,
    surf: false,
    chill: false
  });

  const [loading, setLoading] = useState(false);
  const [ranked, setRanked] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // följer-öar (lokalt via context)
  const { followedIslands } = useFollows();

  // Splash -> Home
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen("home");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setError("Din enhet stödjer inte platsdelning.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setUseGps(true);
        setError("");
        setScreen("filters");
      },
      () => {
        setError("Kunde inte hämta din position.");
      }
    );
  };

  const handleUseCity = () => {
    setUseGps(false);
    setUserLocation(null);
    setScreen("filters");
  };

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  async function calculateRanking() {
    setLoading(true);
    setError("");
    setRanked([]);

    try {
      const maxDays = Math.min(Math.max(days, 1), 10);
      const activePrefs = Object.keys(preferences).filter(
        (key) => preferences[key]
      );
      const endDate = addDays(startDate, maxDays - 1);

      const results = [];

      // Hämta väder SEKVENSIELLT för att undvika 429
      for (const dest of DESTINATIONS) {
        const url = `${OPEN_METEO_BASE}?latitude=${dest.lat}&longitude=${
          dest.lon
        }&daily=temperature_2m_max,precipitation_sum,windspeed_10m_max,precipitation_probability_mean,uv_index_max&hourly=temperature_2m,precipitation,cloudcover,relativehumidity_2m&start_date=${startDate}&end_date=${endDate}&timezone=auto`;

        const res = await fetch(url);

        if (res.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        if (!res.ok) {
          throw new Error("Weather API error");
        }

        const data = await res.json();

        // räkna fram genomsnittlig molnighet för perioden
        let avgCloud = null;
        if (
          data.hourly &&
          data.hourly.cloudcover &&
          data.hourly.time &&
          data.daily &&
          data.daily.time
        ) {
          const validDates = new Set(data.daily.time.slice(0, maxDays));
          let cloudSum = 0;
          let cloudCount = 0;

          for (let i = 0; i < data.hourly.time.length; i++) {
            const dateStr = data.hourly.time[i].split("T")[0];
            if (!validDates.has(dateStr)) continue;
            const c = data.hourly.cloudcover[i];
            if (typeof c === "number") {
              cloudSum += c;
              cloudCount++;
            }
          }

          if (cloudCount > 0) {
            avgCloud = cloudSum / cloudCount; // 0–100%
          }
        }

        const {
          weatherScore,
          preferenceScore,
          totalScore,
          matchPercent
        } = computeScores(
          data.daily,
          maxDays,
          dest,
          activePrefs,
          preference,
          avgCloud
        );

        const analysis = getWeatherAnalysis(
          data.daily,
          maxDays,
          data.hourly
        );

        results.push({
          ...dest,
          score: totalScore,
          weatherScore,
          preferenceScore,
          matchPercent,
          daily: data.daily,
          hourly: data.hourly,
          analysis
        });

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      results.sort((a, b) => b.score - a.score);
      setRanked(results);
      setLastUpdated(new Date().toISOString());
      setScreen("results");
    } catch (e) {
      console.error(e);
      if (e.message === "RATE_LIMIT") {
        setError(
          "Väder-API:t tycker vi frågar för snabbt just nu (429). Testa igen om en liten stund."
        );
      } else {
        setError("Något gick fel när väderdata hämtades.");
      }
    } finally {
      setLoading(false);
    }
  }

  const getStartCityName = () => {
    if (useGps && userLocation) {
      return "din nuvarande position";
    }
    const city = START_CITIES.find((c) => c.id === startCity);
    return city ? city.name : "vald stad";
  };

  const renderSplash = () => (
    <div className="screen splash">
      <div className="logo-circle">TH</div>
      <h1 className="app-title">Travelhunter</h1>
      <p className="subtitle">Jaga bäst väder i Filippinerna.</p>
    </div>
  );

  const renderHome = () => (
    <div className="screen home">
      <h1 className="app-title">Travelhunter</h1>
      <p className="intro-text">
        Alla kan ladda ner appen – välj om du vill utgå från din nuvarande
        position eller en stad som Manila, Cebu, Davao eller Clark.
      </p>

      <div className="card">
        <h2>1. Välj hur vi ska börja</h2>

        <button className="btn primary" onClick={handleUseGps}>
          📍 Använd min nuvarande position
        </button>

        <div className="divider">eller</div>

        <label className="field-label">Startstad</label>
        <select
          className="select"
          value={startCity}
          onChange={(e) => setStartCity(e.target.value)}
        >
          {START_CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button className="btn secondary" onClick={handleUseCity}>
          Ange stad och fortsätt →
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );

  const renderFilters = () => (
    <div className="screen filters">
      <button className="back-btn" onClick={() => setScreen("home")}>
        ← Tillbaka
      </button>

      <h2>Resinställningar</h2>
      <p className="intro-text">
        Välj när ni är på plats, hur många dagar ni har och vad ni är ute efter.
        Travelhunter rankar sen alla destinationer i Filippinerna.
      </p>

      <div className="card">
        <label className="field-label">
          När börjar resan?
          <span className="field-value">
            {startDate === TODAY_STR ? "Idag" : startDate}
          </span>
        </label>
        <input
          type="date"
          className="date-input"
          value={startDate}
          min={TODAY_STR}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label className="field-label">
          Antal dagar (max 10)
          <span className="field-value">{days} dagar</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />

        <label className="field-label">Grund-prioritering</label>
        <select
          className="select"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
        >
          <option value="weather">Bäst väder totalt</option>
          <option value="sun">Maxa solen (minst moln)</option>
        </select>

        <div className="pref-group">
          <div className="pref-title">Vad är ni ute efter?</div>

          <label className="pref-item">
            <input
              type="checkbox"
              checked={preferences.sun}
              onChange={() => togglePreference("sun")}
            />
            <span>☀️ Soljakt (jaga solen)</span>
          </label>

          <label className="pref-item">
            <input
              type="checkbox"
              checked={preferences.party}
              onChange={() => togglePreference("party")}
            />
            <span>🎉 Fest / nightlife</span>
          </label>

          <label className="pref-item">
            <input
              type="checkbox"
              checked={preferences.diving}
              onChange={() => togglePreference("diving")}
            />
            <span>🤿 Dykning</span>
          </label>

          <label className="pref-item">
            <input
              type="checkbox"
              checked={preferences.surf}
              onChange={() => togglePreference("surf")}
            />
            <span>🏄 Surf</span>
          </label>

          <label className="pref-item">
            <input
              type="checkbox"
              checked={preferences.chill}
              onChange={() => togglePreference("chill")}
            />
            <span>😌 Lugn & chill</span>
          </label>
        </div>

        <button
          className="btn primary full"
          onClick={calculateRanking}
          disabled={loading}
        >
          {loading ? "Beräknar..." : "Visa bästa destinationer"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );

  const renderResults = () => {
    const endDate = addDays(startDate, Math.min(Math.max(days, 1), 10) - 1);
    const originCode = ORIGIN_IATA[startCity];

    return (
      <div className="screen results">
        <div className="results-header">
          <button className="back-btn" onClick={() => setScreen("filters")}>
            ← Ändra filter
          </button>
          <h2>Bästa destinationerna just nu</h2>
          <p className="intro-text small">
            Utgår från <strong>{getStartCityName()}</strong> <br />
            Period: {startDate} → {endDate} ({days} dag
            {days > 1 ? "ar" : ""}). <br />
            Sorterat efter väder och vad ni är ute efter.
          </p>

          {lastUpdated && (
            <p className="intro-text small">
              Prognosen senast uppdaterad:{" "}
              <strong>{formatUpdatedTimestamp(lastUpdated)}</strong>
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button
              className="btn secondary"
              onClick={calculateRanking}
              disabled={loading}
            >
              🔄 Uppdatera prognos
            </button>

            {followedIslands.length > 0 && (
              <button
                className="btn secondary"
                onClick={() => setScreen("followed")}
              >
                ⭐ Följda öar & AI-rutt
              </button>
            )}
          </div>
        </div>

        {loading && <p>Laddar väderdata...</p>}
        {error && <p className="error">{error}</p>}

        <div className="destination-list">
          {ranked.map((dest, index) => (
            <DestinationCard
              key={dest.id}
              rank={index + 1}
              days={days}
              destination={dest}
              startDate={startDate}
              originCode={originCode}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFollowed = () => {
    const followedDestinations = DESTINATIONS.filter((d) =>
      followedIslands.includes(d.id)
    );

    const maxDays = Math.min(Math.max(days, 1), 10);

    // Bygg forecastMap till AI:n från befintlig ranked-data
    const forecastMap = {};
    for (const dest of followedDestinations) {
      const rankedDest = ranked.find((r) => r.id === dest.id);
      if (
        !rankedDest ||
        !rankedDest.daily ||
        !rankedDest.daily.time ||
        !rankedDest.daily.temperature_2m_max ||
        !rankedDest.daily.precipitation_sum
      ) {
        continue;
      }

      const dayCount = Math.min(
        maxDays,
        rankedDest.daily.time.length,
        rankedDest.daily.temperature_2m_max.length,
        rankedDest.daily.precipitation_sum.length
      );

      const dailyList = [];
      for (let i = 0; i < dayCount; i++) {
        const date = rankedDest.daily.time[i];
        const temp = rankedDest.daily.temperature_2m_max[i];
        const rain = rankedDest.daily.precipitation_sum[i];

        let icon = "☀️";
        if (rain >= 8) icon = "🌧️";
        else if (rain >= 3) icon = "🌦️";

        dailyList.push({
          date,
          temp,
          rain,
          icon,
          condition: icon,
          rainChance: rain
        });
      }

      forecastMap[dest.id] = { daily: dailyList };
    }

    const aiSummaryText = buildAISummary(followedDestinations, forecastMap);
    const bestRoute = planBestRoute(followedDestinations, forecastMap);

    return (
      <div className="screen followed">
        <button className="back-btn" onClick={() => setScreen("results")}>
          ← Tillbaka till ranking
        </button>

        <h2>Dina följda öar</h2>

        {lastUpdated && (
          <p className="intro-text small">
            Prognosen bygger på senaste uppdateringen:{" "}
            <strong>{formatUpdatedTimestamp(lastUpdated)}</strong>
          </p>
        )}

        {followedDestinations.length === 0 && (
          <p>Du följer inga öar ännu. Gå till ranking och tryck på ♥ för att följa.</p>
        )}

        {followedDestinations.length > 0 && (
          <>
            <section className="card ai-followed-summary">
              <h3>AI-resesammanfattning</h3>
              <pre className="ai-summary-text">{aiSummaryText}</pre>
            </section>

            <section className="card">
              <h3>Föreslagen rutt baserad på vädret</h3>
              {bestRoute && bestRoute.length > 0 ? (
                <ol>
                  {bestRoute.map((d) => (
                    <li key={d.id}>{d.name}</li>
                  ))}
                </ol>
              ) : (
                <p>Ingen rutt kunde beräknas (saknar väderdata). Kör en ranking först.</p>
              )}
            </section>

            <section className="followed-weather-grid">
              {followedDestinations.map((dest) => {
                const fc = forecastMap[dest.id];

                return (
                  <div key={dest.id} className="weather-card">
                    <h3>{dest.name}</h3>
                    {fc && fc.daily && fc.daily.length > 0 ? (
                      <div className="daily-row">
                        {fc.daily.map((day) => (
                          <div key={day.date} className="daily-item">
                            <span>{formatDateLabel(day.date)}</span>
                            <span>{day.icon}</span>
                            <span>{Math.round(day.temp)}°C</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>Ingen väderdata ännu. Kör en ranking först.</p>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      {screen === "splash" && renderSplash()}
      {screen === "home" && renderHome()}
      {screen === "filters" && renderFilters()}
      {screen === "results" && renderResults()}
      {screen === "followed" && renderFollowed()}
    </div>
  );
}

// Kortkomponent med dag-för-dag + timme-för-tim
function DestinationCard({
  rank,
  destination,
  days,
  startDate,
  originCode
}) {
  const {
    id,
    name,
    region,
    tags,
    airport,
    description,
    score,
    weatherScore,
    preferenceScore,
    matchPercent,
    daily,
    hourly,
    analysis,
    iataCode,
    hotelBudget,
    lat,
    lon
  } = destination;

  const [openDayIndex, setOpenDayIndex] = useState(null);
  const { isFollowed, toggleFollow } = useFollows();
  const isFavorite = isFollowed(id);

  const dayCount = Math.min(
    days,
    daily?.time?.length || 0,
    daily?.temperature_2m_max?.length || 0
  );

  const googleFlightsUrl =
    originCode && iataCode && startDate
      ? `https://www.google.com/travel/flights?q=Flights%20from%20${originCode}%20to%20${iataCode}%20on%20${startDate}`
      : null;

  const tripEndDate = addDays(startDate, Math.max(days, 1) - 1);

  const airbnbUrl =
    startDate && days
      ? `https://www.airbnb.com/s/${encodeURIComponent(
          `${name} Philippines`
        )}/homes?checkin=${startDate}&checkout=${tripEndDate}&adults=2`
      : null;

  const thingsToDoUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${name} Philippines things to do`
  )}`;

  const mapsUrl =
    typeof lat === "number" && typeof lon === "number"
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      : `https://www.google.com/maps/search/${encodeURIComponent(
          `${name} Philippines`
        )}`;

  const isTopPick = rank === 1;
  const isStrongMatch = matchPercent >= 70;

  // helper: ta ut timme-för-timme för en viss dag
  const getHourlyForDate = (dateStr) => {
    if (!hourly || !hourly.time) return [];

    const items = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const t = hourly.time[i];
      if (!t.startsWith(dateStr)) continue;

      const hourIndex = parseInt(t.slice(11, 13), 10);
      if (hourIndex % 3 !== 0) continue;

      items.push({
        time: t.slice(11, 16),
        temp: hourly.temperature_2m?.[i],
        rain: hourly.precipitation?.[i],
        clouds: hourly.cloudcover?.[i],
        humidity: hourly.relativehumidity_2m?.[i]
      });
    }
    return items;
  };

  // sammanfattning för perioden (snitt-temp, regn, moln)
  let avgTemp = null;
  let totalRain = null;
  let avgCloudPeriod = null;

  if (
    dayCount > 0 &&
    daily &&
    daily.temperature_2m_max &&
    daily.precipitation_sum
  ) {
    let tempSum = 0;
    let rainSum = 0;

    for (let i = 0; i < dayCount; i++) {
      tempSum += daily.temperature_2m_max[i];
      rainSum += daily.precipitation_sum[i];
    }

    avgTemp = tempSum / dayCount;
    totalRain = rainSum;

    if (hourly && hourly.cloudcover && hourly.time) {
      const validDates = new Set(daily.time.slice(0, dayCount));
      let cloudSum = 0;
      let cloudCount = 0;

      for (let i = 0; i < hourly.time.length; i++) {
        const dateStr = hourly.time[i].split("T")[0];
        if (!validDates.has(dateStr)) continue;

        const c = hourly.cloudcover[i];
        if (typeof c === "number") {
          cloudSum += c;
          cloudCount++;
        }
      }

      if (cloudCount > 0) {
        avgCloudPeriod = cloudSum / cloudCount;
      }
    }
  }

  // genomsnittlig molnighet + ikon för en dag
  const getDayCloudAndIcon = (dateStr, dailyRain) => {
    let cloudSum = 0;
    let cloudCount = 0;
    let maxRain = dailyRain || 0;

    if (hourly && hourly.time && hourly.cloudcover) {
      for (let i = 0; i < hourly.time.length; i++) {
        const t = hourly.time[i];
        if (!t.startsWith(dateStr)) continue;

        const c = hourly.cloudcover[i];
        const r = hourly.precipitation?.[i];

        if (typeof c === "number") {
          cloudSum += c;
          cloudCount++;
        }
        if (typeof r === "number" && r > maxRain) {
          maxRain = r;
        }
      }
    }

    const avgCloud = cloudCount ? cloudSum / cloudCount : null;

    let icon = "🌤️";

    if (maxRain >= 8) icon = "🌧️";
    else if (maxRain >= 2) icon = "🌦️";
    else if (avgCloud != null) {
      if (avgCloud >= 75) icon = "☁️";
      else if (avgCloud >= 40) icon = "⛅";
      else icon = "☀️";
    } else {
      if (dailyRain >= 8) icon = "🌧️";
      else if (dailyRain >= 3) icon = "🌦️";
      else icon = "☀️";
    }

    return { icon, avgCloud, maxRain };
  };

  // ikon per timme
  const getHourlyIcon = (clouds, rain) => {
    if (rain != null && rain > 0.4) return "🌧️";
    if (clouds != null) {
      if (clouds >= 80) return "☁️";
      if (clouds >= 40) return "🌤️";
    }
    return "☀️";
  };

  return (
    <div className="destination-card" id={id}>
      <div className="destination-rank">#{rank}</div>
      <div className="destination-main">
        <div className="destination-header-row">
          <div>
            <h3 className="destination-name">
              {name}{" "}
              {isTopPick && <span className="badge badge-top">Top pick</span>}
              {isStrongMatch && (
                <span className="badge badge-match">Stark matchning</span>
              )}
            </h3>
            <p className="destination-region">{region}</p>
          </div>
          <button
            className={`fav-btn ${isFavorite ? "fav-btn-active" : ""}`}
            onClick={() => toggleFollow(id)}
            title={
              isFavorite ? "Ta bort från följda öar" : "Följ den här ön"
            }
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        <p className="destination-airport">✈ Flyg / resa: {airport}</p>

        <p className="destination-description">{description}</p>

        {analysis && (
          <div className="ai-summary">
            <div className="ai-label">
              <span className="ai-emoji">{analysis.emoji}</span>
              <span>{analysis.label}</span>
            </div>
            <div className="ai-text">
              <strong>{analysis.title}</strong>
              <div>{analysis.message}</div>
            </div>
          </div>
        )}

        <div className="tags">
          {tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>

        <div className="destination-meta">
          <div className="score">
            Total Travelhunter-score:{" "}
            <strong>{score.toFixed(1)}</strong> / 24
          </div>
          <div className="sub-scores">
            <span>☀ Väder: {weatherScore?.toFixed(1) ?? "-"} </span>
            <span>🎯 Era val: {preferenceScore?.toFixed(1) ?? "-"} </span>
          </div>
          <div className="match-line">
            Matchning mot era val:{" "}
            <strong>{matchPercent != null ? `${matchPercent}%` : "-"}</strong>
          </div>

          {hotelBudget && (
            <div className="hotel-line">
              Ca boende:{" "}
              {hotelBudget.low && hotelBudget.mid
                ? `${hotelBudget.low}-${hotelBudget.mid} kr/natt`
                : hotelBudget.mid
                ? `${hotelBudget.mid} kr/natt`
                : "varierar"}
            </div>
          )}
        </div>

        {/* Sammanfattning för perioden */}
        {dayCount > 0 && (
          <div className="period-summary">
            Sammanfattning för perioden:{" "}
            {avgTemp != null && <>≈ {Math.round(avgTemp)}°C</>}{" "}
            {totalRain != null && <>• totalt {totalRain.toFixed(1)} mm regn</>}{" "}
            {avgCloudPeriod != null && <>• ca {Math.round(avgCloudPeriod)}% moln</>}
          </div>
        )}

        {/* Dag-för-dag + klick för timvisa detaljer */}
        {dayCount > 0 && (
          <div className="daily-forecast">
            {Array.from({ length: dayCount }).map((_, i) => {
              const date = daily.time[i];
              const temp = daily.temperature_2m_max[i];
              const rain = daily.precipitation_sum[i];

              let rainText = "nästan inget regn";
              if (rain >= 3 && rain < 8) rainText = "lite regn";
              if (rain >= 8) rainText = "mer regn";

              const isOpen = openDayIndex === i;
              const hourlyItems = isOpen ? getHourlyForDate(date) : [];

              const dayInfo = getDayCloudAndIcon(date, rain);

              return (
                <div key={date} className="daily-block">
                  <button
                    className="daily-row clickable"
                    onClick={() => setOpenDayIndex(isOpen ? null : i)}
                  >
                    <div className="daily-date">
                      <span className="daily-icon">{dayInfo.icon}</span>
                      {formatDateLabel(date)}
                    </div>
                    <div className="daily-temp">
                      {Math.round(temp)}°C
                    </div>
                    <div className="daily-rain">{rainText}</div>
                    <div className="daily-expand">
                      {isOpen ? "▲" : "▼"}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="hourly-panel">
                      {hourlyItems.length === 0 && (
                        <div className="hourly-row no-data">
                          Ingen timprognos hittades.
                        </div>
                      )}

                      {hourlyItems.map((h) => (
                        <div key={h.time} className="hourly-row">
                          <div className="hourly-time">
                            <span className="hourly-icon">
                              {getHourlyIcon(h.clouds, h.rain)}
                            </span>
                            {h.time}
                          </div>
                          <div className="hourly-temp">
                            {Math.round(h.temp)}°C
                          </div>
                          <div className="hourly-extra">
                            {h.rain != null && h.rain > 0.2
                              ? `${h.rain.toFixed(1)} mm`
                              : "nästan inget regn"}
                            {h.clouds != null && <> · {h.clouds}% moln</>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {dayCount === 0 && (
          <div className="daily-forecast no-data">
            Ingen prognos för de här datumen.
          </div>
        )}

        {/* Action-knappar: flyg, Airbnb, saker att göra, karta */}
        <div className="action-buttons">
          {googleFlightsUrl && (
            <a
              className="btn secondary full flights-btn"
              href={googleFlightsUrl}
              target="_blank"
              rel="noreferrer"
            >
              ✈ Visa flygpriser för {startDate}
            </a>
          )}

          {airbnbUrl && (
            <a
              className="btn secondary full"
              href={airbnbUrl}
              target="_blank"
              rel="noreferrer"
            >
              🏡 Sök boende på Airbnb
            </a>
          )}

          <a
            className="btn secondary full"
            href={thingsToDoUrl}
            target="_blank"
            rel="noreferrer"
          >
            🔍 Saker att göra (Google)
          </a>

          <a
            className="btn secondary full"
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            🗺️ Visa läge i Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

// Yttre komponent: lägger på FollowsProvider runt hela appen
export default function App() {
  return (
    <FollowsProvider>
      <InnerApp />
    </FollowsProvider>
  );
}
