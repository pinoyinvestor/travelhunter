# Travelhunter – Chase the Sun in the Philippines ☀️🇵🇭

**Travelhunter** is a weather-driven React application that ranks the best islands in the Philippines based on **sun probability, rain levels, clouds, and your personal travel preferences**.

The app fetches **live weather forecasts** from Open-Meteo and compares destinations such as **Siargao, El Nido, and Siquijor** to help travelers choose where the weather will be the best during their travel dates.

Built for my own upcoming trip — and for anyone who wants to **maximize sunshine and avoid rainy islands**.

---

## 🌴 Features

### 🔥 Live Weather Ranking  
For every destination, Travelhunter retrieves:
- Daily forecast with weather icons (☀️ ⛅ 🌧️)
- Hourly forecast (every 3 hours)
- Temperature, precipitation, wind, cloud coverage
- AI-style weather summary (Sunny, Cloudy But Dry, Rainy Period)

### 🎯 Preference-Based Scoring  
Customize what you're looking for:
- ☀️ Sun seeker mode (max sunshine, minimal clouds)
- 🏄 Surf spots  
- 🤿 Diving spots  
- 🎉 Nightlife / party  
- 😌 Chill & relaxation  

The app generates a **Travelhunter Score** and a **Match Percentage** for each island.

### ✈️ Built-in Quick Travel Tools  
Each island card includes:
- **Google Flights** link based on your selected start city  
- **Airbnb search** for your exact dates  
- **Google Search** for “things to do” on that island  
- **Google Maps** location link  

All in one place — weather + planning.

### 📍 Smart Start Options  
Choose your trip origin:
- Use **current GPS location**
- Select from popular hubs: **Manila, Cebu, Davao, Clark**

---

## ⚙️ Tech Stack

- **React**
- **Open-Meteo API** (live weather data)
- **Vanilla CSS** (custom UI)
- Client-only — *no backend required*

---

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/pinoyinvestor/travelhunter.git
cd travelhunter
