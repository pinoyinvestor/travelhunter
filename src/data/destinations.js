export const DESTINATIONS = [
  {
    id: "siargao",
    name: "Siargao",
    region: "Mindanao",
    tags: ["Surf", "Island hopping", "Chill", "Sol"],
    airport: "Siargao (IAO) via Cebu/Manila",
    iataCode: "IAO",
    lat: 9.8482,
    lon: 126.0458,
    description:
      "Surfparadis med palmer, laguner och ö-hoppning runt General Luna och Cloud 9.",
    airbnbQuery: "General Luna, Siargao Island, Philippines",
    hotelBudget: { low: 300, mid: 800, high: 1800 },
    activities: [
      {
        id: "cloud9",
        name: "Cloud 9 Surfspot",
        type: "Surf",
        lat: 9.8488,
        lon: 126.1653,
        note: "Perfekt för surfare, ikoniskt torn."
      },
      {
        id: "sugbalagoon",
        name: "Sugba Lagoon",
        type: "Lagoon",
        lat: 9.8456,
        lon: 125.9363,
        note: "Blå lagun – kajak, paddleboard, hopp."
      },
      {
        id: "magpupungko",
        name: "Magpupungko Rock Pools",
        type: "Pooler",
        lat: 9.8411,
        lon: 125.9785,
        note: "Naturliga pooler vid lågvatten."
      }
    ]
  },

  {
    id: "boracay",
    name: "Boracay",
    region: "Western Visayas",
    tags: ["Strand", "Nightlife", "Familj", "Sol"],
    airport: "Caticlan (MPH) / Kalibo (KLO)",
    iataCode: "MPH",
    lat: 11.9674,
    lon: 121.9248,
    description:
      "Vita stränder, klart vatten och mycket restauranger och barer längs White Beach.",
    airbnbQuery: "Boracay, Aklan, Philippines",
    hotelBudget: { low: 400, mid: 1000, high: 2200 },
    activities: [
      {
        id: "whitebeach",
        name: "White Beach",
        type: "Strand",
        lat: 11.9622,
        lon: 121.9270,
        note: "Huvudstranden uppdelad i Station 1–3."
      },
      {
        id: "wilysrock",
        name: "Willy's Rock",
        type: "Foto",
        lat: 11.9664,
        lon: 121.9238,
        note: "Känd ikon i vattnet."
      },
      {
        id: "mtluho",
        name: "Mount Luho Viewpoint",
        type: "Utsikt",
        lat: 11.9815,
        lon: 121.9392,
        note: "Bästa utsikten på ön."
      }
    ]
  },

  {
    id: "cebu",
    name: "Cebu",
    region: "Central Visayas",
    tags: ["Stad", "Strand", "Utflykter", "Dykning"],
    airport: "Cebu (CEB)",
    iataCode: "CEB",
    lat: 10.3157,
    lon: 123.8854,
    description:
      "Mix av city och natur – vattenfall, öar som Malapascua och Moalboal inom räckhåll.",
    airbnbQuery: "Cebu City, Cebu, Philippines",
    hotelBudget: { low: 350, mid: 900, high: 2000 },
    activities: [
      {
        id: "kawasan",
        name: "Kawasan Falls",
        type: "Vattenfall",
        lat: 9.8087,
        lon: 123.3657,
        note: "Populärt canyoneering-äventyr."
      },
      {
        id: "sardine",
        name: "Moalboal Sardine Run",
        type: "Dykning",
        lat: 9.9414,
        lon: 123.3710,
        note: "Miljontals sardiner året runt."
      }
    ]
  },

  {
    id: "panglao",
    name: "Panglao (Bohol)",
    region: "Central Visayas",
    tags: ["Dykning", "Strand", "Chill"],
    airport: "Bohol–Panglao (TAG)",
    iataCode: "TAG",
    lat: 9.588,
    lon: 123.749,
    description:
      "Fina stränder och dykning. Nära Chocolate Hills och tarsiers.",
    airbnbQuery: "Panglao, Bohol, Philippines",
    hotelBudget: { low: 350, mid: 900, high: 1800 },
    activities: [
      {
        id: "alona",
        name: "Alona Beach",
        type: "Strand",
        lat: 9.5518,
        lon: 123.7735
      },
      {
        id: "chocolate",
        name: "Chocolate Hills",
        type: "Utsikt",
        lat: 9.8499,
        lon: 124.1435
      }
    ]
  },

  {
    id: "siquijor",
    name: "Siquijor",
    region: "Central Visayas",
    tags: ["Lugn", "Vattenfall", "Scooter"],
    airport: "Färja från Dumaguete (DGT)",
    iataCode: "DGT",
    lat: 9.2148,
    lon: 123.515,
    description:
      "Mysig ö med vattenfall, klipphopp och magiska solnedgångar.",
    airbnbQuery: "Siquijor, Philippines",
    hotelBudget: { low: 300, mid: 700, high: 1500 },
    activities: [
      {
        id: "cambugahay",
        name: "Cambugahay Falls",
        type: "Vattenfall",
        lat: 9.1637,
        lon: 123.5954
      },
      {
        id: "salagdoong",
        name: "Salagdoong Cliff Jump",
        type: "Klipphopp",
        lat: 9.2122,
        lon: 123.6464
      }
    ]
  },

  {
    id: "elnido",
    name: "El Nido",
    region: "Palawan",
    tags: ["Island hopping", "Snorkling", "Foto"],
    airport: "El Nido (ENI) / Puerto Princesa (PPS)",
    iataCode: "ENI",
    lat: 11.178,
    lon: 119.391,
    description:
      "Kalkstensklippor, turkost vatten och ö-hoppning bland laguner och stränder.",
    airbnbQuery: "El Nido, Palawan, Philippines",
    hotelBudget: { low: 400, mid: 900, high: 2000 },
    activities: [
      {
        id: "biglagoon",
        name: "Big Lagoon",
        type: "Lagoon",
        lat: 11.1728,
        lon: 119.4179
      },
      {
        id: "smalllagoon",
        name: "Small Lagoon",
        type: "Lagoon",
        lat: 11.1606,
        lon: 119.4172
      }
    ]
  },

  {
    id: "coron",
    name: "Coron",
    region: "Palawan",
    tags: ["Dykning", "Vrak", "Laguner"],
    airport: "Busuanga (USU)",
    iataCode: "USU",
    lat: 11.9994,
    lon: 120.2044,
    description:
      "Kända laguner, sjöar och vrakdykning. Perfekt för äventyr och båtturer.",
    airbnbQuery: "Coron, Palawan, Philippines",
    hotelBudget: { low: 400, mid: 900, high: 1800 },
    activities: [
      {
        id: "kayangan",
        name: "Kayangan Lake",
        type: "Lake",
        lat: 12.0028,
        lon: 120.2240
      },
      {
        id: "twinlagoon",
        name: "Twin Lagoon",
        type: "Lagoon",
        lat: 12.0165,
        lon: 120.2236
      }
    ]
  },

  {
    id: "puertoprincesa",
    name: "Puerto Princesa",
    region: "Palawan",
    tags: ["Utflykter", "Underground River"],
    airport: "Puerto Princesa (PPS)",
    iataCode: "PPS",
    lat: 9.7392,
    lon: 118.7353,
    description:
      "Bra bas på Palawan med utflykter och den berömda underjordiska floden.",
    airbnbQuery: "Puerto Princesa, Philippines",
    hotelBudget: { low: 350, mid: 850, high: 1600 },
    activities: [
      {
        id: "underground",
        name: "Underground River",
        type: "Natur",
        lat: 10.1937,
        lon: 118.9269
      }
    ]
  },

  {
    id: "launion",
    name: "La Union",
    region: "Luzon",
    tags: ["Surf", "Weekend", "Från Manila"],
    airport: "Landväg från Manila (ca 4–6 h)",
    iataCode: "MNL",
    lat: 16.6159,
    lon: 120.3199,
    description:
      "Populär surf- och weekenddestination för locals och turister från Manila.",
    airbnbQuery: "San Juan, La Union, Philippines",
    hotelBudget: { low: 300, mid: 800, high: 1500 },
    activities: [
      {
        id: "sanjuan",
        name: "San Juan Surf Beach",
        type: "Surf",
        lat: 16.6694,
        lon: 120.3190
      }
    ]
  },

  {
    id: "baguio",
    name: "Baguio",
    region: "Luzon",
    tags: ["Svalare klimat", "Stad", "Weekend"],
    airport: "Landväg från Manila (ca 4–6 h)",
    iataCode: "MNL",
    lat: 16.4023,
    lon: 120.596,
    description:
      "Svalare bergsklimat, perfekt för att komma undan värmen.",
    airbnbQuery: "Baguio, Philippines",
    hotelBudget: { low: 300, mid: 700, high: 1200 },
    activities: [
      {
        id: "burnham",
        name: "Burnham Park",
        type: "Park",
        lat: 16.4116,
        lon: 120.5942
      },
      {
        id: "minesview",
        name: "Mines View Park",
        type: "Utsikt",
        lat: 16.4222,
        lon: 120.6270
      }
    ]
  }
];
