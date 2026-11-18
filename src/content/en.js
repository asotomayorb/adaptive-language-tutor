export const english = {
  id: "en",
  label: "Inglés",
  locale: "en",
  exercises: [
    { id:"en-greet-01", level:"A1", topic:"daily", skill:"Greetings", prompt:"¿Cómo se dice “Buenos días” en inglés?", target:"Good morning", term:"Good morning", meaning:"Buenos días", options:["Good night","Good morning","See you"], hint:"Morning es la mañana.", hintSpeechSegments:["Morning"], explanationSpeechSegments:["Good morning"], explanation:"Good morning se usa para saludar durante la mañana." },
    { id:"en-verb-01", level:"A1", topic:"daily", skill:"Verb to be", prompt:"Completa: I ___ from Chile.", target:"am", term:"am", meaning:"soy / estoy", options:["is","are","am"], hint:"Con el pronombre I se usa am.", hintSpeechSegments:["I","am"], explanationSpeechSegments:["I am"], explanation:"La forma correcta es I am." },
    { id:"en-travel-01", level:"A1", topic:"travel", skill:"Useful questions", prompt:"¿Cómo preguntas “¿Dónde está el baño?”", target:"Where is the bathroom?", acceptedAnswers:["Where is the restroom?"], term:"bathroom", meaning:"baño", options:["How much is it?","Where is the bathroom?","What time is it?"], hint:"Where pregunta dónde.", hintSpeechSegments:["Where"], explanationSpeechSegments:["Where is"], explanation:"Where is...? pregunta dónde está algo." },
    { id:"en-food-01", level:"A1", topic:"food", skill:"Ordering food", prompt:"¿Qué expresión significa “Quisiera un café”?", target:"I would like a coffee", acceptedAnswers:["I'd like a coffee"], term:"I would like", meaning:"Quisiera", options:["I would like a coffee","I am hungry","The bill, please"], hint:"Would like es una forma cortés de pedir.", hintSpeechSegments:["Would like"], explanationSpeechSegments:["I would like"], explanation:"I would like... equivale a quisiera..." },
    { id:"en-work-01", level:"A1", topic:"work", skill:"Introductions", prompt:"Completa: My name ___ Ana.", target:"is", term:"name", meaning:"nombre", options:["am","is","are"], hint:"My name significa mi nombre.", hintSpeechSegments:["My name"], explanationSpeechSegments:["My name is"], explanation:"My name is... significa Mi nombre es..." },
    { id:"en-greet-02", level:"A2", topic:"daily", skill:"Conversation", prompt:"¿Cómo respondes “Nice to meet you”?", target:"Nice to meet you too", acceptedAnswers:["You too"], term:"Nice to meet you too", meaning:"Igualmente / Encantado también", options:["Nice to meet you too","See you yesterday","Excuse me"], hint:"Añade too para expresar también.", hintSpeechSegments:["too"], explanationSpeechSegments:["Nice to meet you too"], explanation:"Nice to meet you too es una respuesta natural." },
    { id:"en-travel-02", level:"A2", topic:"travel", skill:"Transport", prompt:"Traduce: “Quiero comprar un billete.”", target:"I want to buy a ticket", acceptedAnswers:["I'd like to buy a ticket"], term:"ticket", meaning:"billete / entrada", options:["I want to buy a ticket","I want to pay the bill","Where is the beach"], hint:"Ticket significa billete o entrada.", hintSpeechSegments:["Ticket"], explanationSpeechSegments:["I want to buy a ticket"], explanation:"I want to buy a ticket expresa que quieres comprar un billete." }
  ,
      {
        "id": "en-daily-02",
        "level": "A1",
        "topic": "daily",
        "skill": "Everyday questions",
        "prompt": "¿Cómo preguntas “¿Cómo estás?” en inglés?",
        "target": "How are you?",
        "acceptedAnswers": [
          "How are you doing?"
        ],
        "term": "How are you?",
        "meaning": "¿Cómo estás?",
        "options": [
          "How are you?",
          "Where are you?",
          "Who are you?"
        ],
        "hint": "Empieza con How (cómo).",
        hintSpeechSegments:["How"], explanationSpeechSegments:["How are you?"], "explanation": "How are you? es la pregunta habitual para saber cómo está alguien."
      },
      {
        "id": "en-daily-03",
        "level": "A1",
        "topic": "daily",
        "skill": "Present simple",
        "prompt": "Completa: I ___ in Santiago. (Vivo en Santiago.)",
        "target": "live",
        "term": "to live",
        "meaning": "vivir",
        "options": [
          "live",
          "lives",
          "living"
        ],
        "hint": "Con I se usa la forma base del verbo.",
        hintSpeechSegments:["I"], explanationSpeechSegments:["I live"], "explanation": "I live significa yo vivo. En presente simple, live no lleva -s con I."
      },
      {
        "id": "en-travel-03",
        "level": "A1",
        "topic": "travel",
        "skill": "Prices",
        "prompt": "¿Cómo preguntas “¿Cuánto cuesta?”",
        "target": "How much is it?",
        "acceptedAnswers": [
          "How much does it cost?"
        ],
        "term": "How much is it?",
        "meaning": "¿Cuánto cuesta?",
        "options": [
          "How much is it?",
          "Where is it?",
          "What time is it?"
        ],
        "hint": "How much pregunta por una cantidad o precio.",
        hintSpeechSegments:["How much"], explanationSpeechSegments:["How much is it?"], "explanation": "How much is it? es una forma común de preguntar el precio."
      },
      {
        "id": "en-travel-04",
        "level": "A2",
        "topic": "travel",
        "skill": "Accommodation",
        "prompt": "Traduce: “Necesito una habitación para dos personas.”",
        "target": "I need a room for two people",
        "acceptedAnswers": [
          "I need a double room"
        ],
        "term": "room",
        "meaning": "habitación",
        "options": [
          "I need a room for two people",
          "I need two tickets",
          "I want a table for two"
        ],
        "hint": "Room significa habitación.",
        hintSpeechSegments:["Room"], explanationSpeechSegments:["I need a room for two people"], "explanation": "I need... expresa una necesidad; for two people indica para dos personas."
      },
      {
        "id": "en-food-02",
        "level": "A1",
        "topic": "food",
        "skill": "At a restaurant",
        "prompt": "¿Cómo pides “La cuenta, por favor”?",
        "target": "The bill, please",
        "acceptedAnswers": [
          "The check, please"
        ],
        "term": "bill",
        "meaning": "cuenta (restaurante)",
        "options": [
          "The bill, please",
          "The menu, please",
          "Enjoy your meal"
        ],
        "hint": "Bill se usa habitualmente en inglés británico; check es común en Estados Unidos.",
        hintSpeechSegments:["Bill","check"], explanationSpeechSegments:["The bill, please","The check, please"], "explanation": "The bill, please es habitual en Reino Unido; The check, please es común en Estados Unidos."
      },
      {
        "id": "en-food-03",
        "level": "A2",
        "topic": "food",
        "skill": "Food preferences",
        "prompt": "Traduce: “Sin cebolla, por favor.”",
        "target": "No onion, please",
        "acceptedAnswers": [
          "Without onion, please"
        ],
        "term": "without",
        "meaning": "sin",
        "options": [
          "No onion, please",
          "With onion, please",
          "More water, please"
        ],
        "hint": "Without significa sin.",
        hintSpeechSegments:["Without"], explanationSpeechSegments:["No onion, please"], "explanation": "No onion, please es una petición breve y natural al pedir comida."
      },
      {
        "id": "en-work-02",
        "level": "A1",
        "topic": "work",
        "skill": "Occupations",
        "prompt": "Completa: I ___ in an office. (Trabajo en una oficina.)",
        "target": "work",
        "term": "to work",
        "meaning": "trabajar",
        "options": [
          "work",
          "works",
          "working"
        ],
        "hint": "Con I se usa la forma base del verbo.",
        hintSpeechSegments:["I","work"], explanationSpeechSegments:["I work","Works"], "explanation": "I work significa yo trabajo. Works se usa con he, she o it."
      },
      {
        "id": "en-work-03",
        "level": "A2",
        "topic": "work",
        "skill": "Asking for clarification",
        "prompt": "¿Cómo dices “¿Puede repetir, por favor?” de forma cortés?",
        "target": "Could you repeat that, please?",
        "acceptedAnswers": [
          "Can you repeat that, please?"
        ],
        "term": "repeat",
        "meaning": "repetir",
        "options": [
          "Could you repeat that, please?",
          "Could you wait here, please?",
          "Could you call me tomorrow?"
        ],
        "hint": "Repeat significa repetir; could you suaviza la petición.",
        hintSpeechSegments:["Repeat","Could you"], explanationSpeechSegments:["Could you repeat that, please?"], "explanation": "Could you repeat that, please? es una forma cortés y natural de pedir que repitan algo."
      },
      {
        "id": "en-daily-04",
        "level": "A2",
        "topic": "daily",
        "skill": "Past simple",
        "prompt": "Completa: Yesterday I ___ to the market.",
        "target": "went",
        "term": "yesterday",
        "meaning": "ayer",
        "options": [
          "went",
          "go",
          "will go"
        ],
        "hint": "Yesterday indica pasado.",
        hintSpeechSegments:["Yesterday"], explanationSpeechSegments:["Went","Will go"], "explanation": "Went es el pasado irregular de go. Will go expresa futuro."
      },
      {
        "id": "en-travel-05",
        "level": "A2",
        "topic": "travel",
        "skill": "Directions",
        "prompt": "¿Cómo dices “Siga todo recto”?",
        "target": "Go straight ahead",
        "acceptedAnswers": [
          "Keep going straight"
        ],
        "term": "straight ahead",
        "meaning": "todo recto",
        "options": [
          "Go straight ahead",
          "Turn left",
          "Cross the street"
        ],
        "hint": "Straight ahead significa todo recto.",
        hintSpeechSegments:["Straight ahead"], explanationSpeechSegments:["Go straight ahead"], "explanation": "Go straight ahead es una instrucción habitual para continuar recto."
      }
  ]
};
