# Travelhunter – Jaga solen i Filippinerna ☀️🇵🇭

Travelhunter är en React-app byggd för att planera en resa i Filippinerna genom att **jaga bäst väder mellan olika öar**.

Du anger reseperiod, antal dagar och vad du är ute efter (sol, surf, dykning, chill osv). Appen hämtar live-prognoser från Open-Meteo och **rankar ö-destinationer** (t.ex. Siargao, El Nido, Siquijor) efter:

- hur bra vädret är (temperatur, regn, vind)
- hur mycket sol/mindre moln det är
- hur bra destinationen matchar dina preferenser (sol, surf, party, dykning, chill)

Perfekt för att planera en resa där du vill **maxa solchanserna** och se vilken ö som ser bäst ut just de dagar du ska resa.

---

## Funktioner

- 🔍 Välj start:
  - Använd **din nuvarande position** via GPS  
  - Eller välj en startstad som **Manila, Cebu, Davao eller Clark**

- 📅 Resinställningar:
  - Välj **startdatum**
  - Välj **antal dagar** (1–10)
  - Välj **grund-prioritering**:
    - “Bäst väder totalt”
    - “Maxa solen (minst moln)”
  - Välj vad ni är ute efter:
    - ☀️ Soljakt  
    - 🎉 Party / nightlife  
    - 🤿 Dykning  
    - 🏄 Surf  
    - 😌 Lugn & chill  

- ☁️ Väderanalys:
  - Hämtar **live-väder** per destination via Open-Meteo
  - Visar:
    - **dag-för-dag** (ikon + max-temp + regn-info)
    - **timvis** var 3:e timme när du klickar på en dag
  - AI-lik sammanfattning per destination:
    - t.ex. “Sol-säkert”, “Molnigt men torrt”, “Regnigare period”

- 📊 Ranking & score:
  - Varje destination får:
    - Total **Travelhunter-score**
    - **Väderscore**
    - **Matchningsscore** mot dina val
    - Matchning i procent (t.ex. 82% match)

- 🌍 Snabbknappar per destination:
  - ✈ **Visa flygpriser via Google Flights** från vald stad
  - 🏡 **Sök boende på Airbnb** mellan dina datum
  - 🔍 **Saker att göra** – Google-sökning på aktiviteter för ön
  - 🗺️ **Visa platsen på Google Maps**

- ❤️ Favoriter:
  - Markera öar du gillar med hjärta för att hålla koll på dina favoriter.

---

## Teknisk stack

- **React**
- **Open-Meteo API** för väderdata
- Ren **CSS** för UI/design (`styles.css`)
- Ingen backend – all logik körs i frontend

---

## Kom igång

1. Klona repot:

   ```bash
   git clone https://github.com/<ditt-användarnamn>/<ditt-repo-namn>.git
   cd <ditt-repo-namn>
