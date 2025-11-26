// src/utils/tripAi.js

// forecastMap: { [id]: { daily: [{ date, temp, condition, icon, rainChance }, ...] } }
export function buildAISummary(destinations, forecastMap) {
  if (!destinations.length) return "Inga följda öar än. Följ några för att få en sammanfattning.";

  let lines = [];

  destinations.forEach((dest) => {
    const fc = forecastMap[dest.id];
    if (!fc || !fc.daily || fc.daily.length === 0) {
      lines.push(`${dest.name}: ingen väderdata ännu.`);
      return;
    }

    const days = fc.daily;
    const sunnyDays = days.filter((d) => d.icon === "☀️").length;
    const cloudyDays = days.filter((d) => d.icon === "⛅").length;
    const rainyDays = days.filter((d) => d.icon === "🌧️").length;
    const avgTemp =
      days.reduce((sum, d) => sum + (d.temp || 0), 0) / days.length;

    lines.push(
      `${dest.name}: ca ${avgTemp.toFixed(
        1
      )}°C, ${sunnyDays} soldagar, ${cloudyDays} molniga, ${rainyDays} regniga.`
    );
  });

  // enkel rekommendation: välj ö med flest soldagar
  const scored = destinations.map((dest) => {
    const fc = forecastMap[dest.id];
    if (!fc || !fc.daily) return { dest, score: -999 };

    const days = fc.daily;
    const sunny = days.filter((d) => d.icon === "☀️").length;
    const rain = days.filter((d) => d.icon === "🌧️").length;

    const score = sunny * 2 - rain; // viktar sol högre, regn minus
    return { dest, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]?.dest;

  if (!best) {
    return lines.join(" ");
  }

  return (
    lines.join(" ") +
    `\n\n🔍 Rekommendation just nu: ${best.name} ser starkast ut vädermässigt under perioden.`
  );
}

// Bästa rutt = sortera öarna efter score (mest sol -> minst regn)
export function planBestRoute(destinations, forecastMap) {
  if (destinations.length <= 1) return destinations;

  const scored = destinations.map((dest) => {
    const fc = forecastMap[dest.id];
    if (!fc || !fc.daily) return { dest, score: -999 };

    const days = fc.daily;
    const sunny = days.filter((d) => d.icon === "☀️").length;
    const rain = days.filter((d) => d.icon === "🌧️").length;
    const avgTemp =
      days.reduce((sum, d) => sum + (d.temp || 0), 0) / days.length;

    // väder-score: mer sol, mindre regn, inte för kallt
    const score = sunny * 3 - rain * 2 + avgTemp * 0.1;
    return { dest, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((x) => x.dest);
}
