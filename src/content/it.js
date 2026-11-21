export const italian = {
  id: "it-IT",
  label: "Italiano",
  locale: "it-IT",
  exercises: [
    {
      id: "it-fixture-01",
      level: "A1",
      topic: "daily",
      skill: "Saluti",
      prompt: "¿Cómo se dice «Buenos días» en italiano?",
      target: "Buongiorno",
      term: "Buongiorno",
      meaning: "Buenos días",
      options: ["Buonasera", "Buongiorno", "Arrivederci"],
      hint: "La expresión empieza con «buon».",
      hintSpeechSegments: ["buon"],
      explanationSpeechSegments: ["Buongiorno"],
      explanation: "Buongiorno es el saludo habitual durante la mañana y parte del día."
    },
    {
      id: "it-fixture-02",
      level: "A1",
      topic: "travel",
      skill: "Preguntas útiles",
      prompt: "¿Cómo preguntas «¿Dónde está la estación?»",
      target: "Dov'è la stazione?",
      term: "stazione",
      meaning: "estación",
      options: ["Quanto costa?", "Dov'è la stazione?", "A che ora?"],
      hint: "Dov'è significa «dónde está».",
      hintSpeechSegments: ["Dov'è"],
      explanationSpeechSegments: ["Dov'è la stazione?"],
      explanation: "Dov'è la stazione? permite preguntar por la ubicación de la estación."
    },
    {
      id: "it-fixture-03",
      level: "A1",
      topic: "food",
      skill: "Pedir comida",
      prompt: "¿Qué expresión significa «La cuenta, por favor»?",
      target: "Il conto, per favore",
      term: "conto",
      meaning: "cuenta",
      options: ["Un tavolo per due", "Il conto, per favore", "Ho fame"],
      hint: "Conto es la cuenta del restaurante.",
      hintSpeechSegments: ["conto"],
      explanationSpeechSegments: ["Il conto, per favore"],
      explanation: "Il conto, per favore es la forma habitual de pedir la cuenta."
    },
    {
      id: "it-fixture-04",
      level: "A2",
      topic: "work",
      skill: "Presentaciones",
      prompt: "Completa: Mi chiamo Luca e ___ a Santiago.",
      target: "lavoro",
      term: "lavorare",
      meaning: "trabajar",
      options: ["lavoro", "lavora", "lavorano"],
      hint: "Con io se usa la primera persona singular.",
      hintSpeechSegments: ["io"],
      explanationSpeechSegments: ["lavoro", "lavorare"],
      explanation: "Lavoro significa «trabajo» en primera persona del singular."
    }
  ]
};
