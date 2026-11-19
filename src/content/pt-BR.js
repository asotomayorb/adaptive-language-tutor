export const ptBR = {
  id: "pt-BR",
  label: "Portugués brasileño",
  locale: "pt-BR",
  exercises: [
    { id:"pt-greet-01", level:"A1", topic:"daily", skill:"Comprensión auditiva", prompt:"Ouça a frase em português e escolha seu significado em espanhol.", target:"Buenos días", term:"Bom dia", meaning:"Buenos días", options:["Buenas noches","Buenos días","Hasta luego"], speechText:"Bom dia", speechLocale:"pt-BR", speechMode:"listening", hint:"Es un saludo que se utiliza durante la mañana.", hintSpeechSegments:[], explanationSpeechSegments:["Bom dia"], explanation:"Bom dia significa Buenos días y se utiliza durante la mañana." },
    { id:"pt-verb-01", level:"A1", topic:"daily", skill:"Verbo ser", prompt:"Complete a frase: Eu ___ chileno.", target:"sou", term:"sou", meaning:"soy", options:["sou","estou","é"], hint:"Para identidad u origen, usa el verbo ser.", hintSpeechSegments:[], explanationSpeechSegments:["Eu sou","Estou"], explanation:"Eu sou significa yo soy. Estou suele expresar estado o ubicación." },
    { id:"pt-travel-01", level:"A1", topic:"travel", skill:"Preguntas útiles", prompt:"Como você pergunta: ‘Onde fica o banheiro?’", target:"Onde fica o banheiro?", acceptedAnswers:["Onde está o banheiro?"], term:"banheiro", meaning:"baño", options:["Quanto custa?","Onde fica o banheiro?","Que horas são?"], hint:"Empieza con Onde (dónde).", hintSpeechSegments:["Onde"], explanationSpeechSegments:["Onde fica"], explanation:"Onde fica...? pregunta dónde se encuentra algo." },
    { id:"pt-food-01", level:"A1", topic:"food", skill:"Pedir comida", prompt:"Qual frase em português expressa um pedido educado de café?", target:"Eu gostaria de um café", acceptedAnswers:["Gostaria de um café"], term:"café", meaning:"café", options:["Eu gostaria de um café","Estou com fome","A conta, por favor"], hint:"Gostaria es una forma cortés de pedir.", hintSpeechSegments:["Gostaria"], explanationSpeechSegments:["Eu gostaria de"], explanation:"Eu gostaria de... equivale a quisiera..." },
    { id:"pt-work-01", level:"A1", topic:"work", skill:"Presentaciones", prompt:"Completa: Meu nome ___ Ana.", target:"é", term:"nome", meaning:"nombre", options:["sou","é","estou"], hint:"Meu nome significa mi nombre.", hintSpeechSegments:["Meu nome"], explanationSpeechSegments:["Meu nome é"], explanation:"Meu nome é... significa Mi nombre es..." },
    { id:"pt-greet-02", level:"A2", topic:"daily", skill:"Conversación", prompt:"¿Cómo respondes “Muito prazer” (mucho gusto)?", target:"O prazer é meu", acceptedAnswers:["Prazer é meu"], term:"O prazer é meu", meaning:"El gusto es mío", options:["O prazer é meu","Até amanhã","Com licença"], hint:"La respuesta expresa que el placer también es tuyo.", hintSpeechSegments:[], explanationSpeechSegments:["O prazer é meu"], explanation:"O prazer é meu es una respuesta natural a Muito prazer." },
    { id:"pt-travel-02", level:"A2", topic:"travel", skill:"Transporte", prompt:"Traduce: “Quiero comprar un billete.”", target:"Quero comprar uma passagem", acceptedAnswers:["Eu quero comprar uma passagem"], term:"passagem", meaning:"billete / pasaje", options:["Quero comprar uma passagem","Quero fechar a conta","Onde fica a praia"], hint:"Quero significa quiero; passagem es pasaje.", hintSpeechSegments:["Quero","passagem"], explanationSpeechSegments:["Quero comprar uma passagem"], explanation:"Quero comprar uma passagem es una forma habitual de expresar esta necesidad." }
  ,
      {
        "id": "pt-daily-02",
        "level": "A1",
        "topic": "daily",
        "skill": "Preguntas cotidianas",
        "prompt": "¿Cómo preguntas “¿Cómo estás?” en portugués brasileño?",
        "target": "Como você está?",
        "acceptedAnswers": [
          "Como vai você?"
        ],
        "term": "Como você está?",
        "meaning": "¿Cómo estás?",
        "options": [
          "Como você está?",
          "Onde você mora?",
          "Quantos anos você tem?"
        ],
        "hint": "Empieza con Como (cómo).",
        hintSpeechSegments:["Como"], explanationSpeechSegments:["Como você está?"], "explanation": "Como você está? es una pregunta habitual para saber cómo se encuentra alguien."
      },
      {
        "id": "pt-daily-03",
        "level": "A1",
        "topic": "daily",
        "skill": "Verbo morar",
        "prompt": "Completa: Eu ___ em Santiago. (Vivo en Santiago.)",
        "target": "moro",
        "term": "morar",
        "meaning": "vivir / residir",
        "options": [
          "moro",
          "mora",
          "moram"
        ],
        "hint": "Con Eu se usa la primera persona singular.",
        hintSpeechSegments:["Eu"], explanationSpeechSegments:["Eu moro","Morar"], "explanation": "Eu moro significa yo vivo. Morar se usa para hablar del lugar donde resides."
      },
      {
        "id": "pt-travel-03",
        "level": "A1",
        "topic": "travel",
        "skill": "Precios",
        "prompt": "¿Cómo preguntas “¿Cuánto cuesta?”",
        "target": "Quanto custa?",
        "term": "Quanto custa?",
        "meaning": "¿Cuánto cuesta?",
        "options": [
          "Quanto custa?",
          "Onde fica?",
          "Que horas são?"
        ],
        "hint": "Quanto se relaciona con cantidad.",
        hintSpeechSegments:["Quanto"], explanationSpeechSegments:["Quanto custa?"], "explanation": "Quanto custa? es la forma habitual de preguntar el precio."
      },
      {
        "id": "pt-travel-04",
        "level": "A2",
        "topic": "travel",
        "skill": "Alojamiento",
        "prompt": "Traduce: “Necesito una habitación para dos personas.”",
        "target": "Preciso de um quarto para duas pessoas",
        "acceptedAnswers": [
          "Eu preciso de um quarto para duas pessoas"
        ],
        "term": "quarto",
        "meaning": "habitación / cuarto",
        "options": [
          "Preciso de um quarto para duas pessoas",
          "Quero uma mesa para duas pessoas",
          "Preciso de duas passagens"
        ],
        "hint": "Quarto significa habitación; para duas pessoas significa para dos personas.",
        hintSpeechSegments:["Quarto","duas pessoas"], explanationSpeechSegments:["Preciso de","Quarto","pessoas"], "explanation": "Preciso de... expresa una necesidad. Quarto es habitación y pessoas es personas."
      },
      {
        "id": "pt-food-02",
        "level": "A1",
        "topic": "food",
        "skill": "En restaurantes",
        "prompt": "¿Cómo pides “La cuenta, por favor”?",
        "target": "A conta, por favor",
        "term": "A conta",
        "meaning": "la cuenta",
        "options": [
          "A conta, por favor",
          "O cardápio, por favor",
          "Bom apetite"
        ],
        "hint": "Conta es la cuenta que pagas al terminar.",
        hintSpeechSegments:["Conta"], explanationSpeechSegments:["A conta, por favor"], "explanation": "A conta, por favor es la forma común de pedir la cuenta en un restaurante."
      },
      {
        "id": "pt-food-03",
        "level": "A2",
        "topic": "food",
        "skill": "Preferencias alimentarias",
        "prompt": "Traduce: “Sin cebolla, por favor.”",
        "target": "Sem cebola, por favor",
        "term": "sem cebola",
        "meaning": "sin cebolla",
        "options": [
          "Sem cebola, por favor",
          "Com cebola, por favor",
          "Mais água, por favor"
        ],
        "hint": "Sem significa sin.",
        hintSpeechSegments:["Sem"], explanationSpeechSegments:["Sem","cebola"], "explanation": "Sem expresa ausencia de algo; cebola significa cebolla."
      },
      {
        "id": "pt-work-02",
        "level": "A1",
        "topic": "work",
        "skill": "Ocupaciones",
        "prompt": "Completa: Eu ___ em um escritório. (Trabajo en una oficina.)",
        "target": "trabalho",
        "term": "trabalhar",
        "meaning": "trabajar",
        "options": [
          "trabalho",
          "trabalha",
          "trabalham"
        ],
        "hint": "Con Eu se usa trabalho.",
        hintSpeechSegments:["Eu","trabalho"], explanationSpeechSegments:["Eu trabalho","trabalhar"], "explanation": "Eu trabalho significa yo trabajo. En portugués, trabajar se dice trabalhar."
      },
      {
        "id": "pt-work-03",
        "level": "A2",
        "topic": "work",
        "skill": "Pedir aclaraciones",
        "prompt": "¿Cómo dices “¿Puede repetir, por favor?” de forma cortés?",
        "target": "Pode repetir, por favor?",
        "acceptedAnswers": [
          "Você pode repetir, por favor?"
        ],
        "term": "repetir",
        "meaning": "repetir",
        "options": [
          "Pode repetir, por favor?",
          "Pode esperar aqui?",
          "Pode me ajudar amanhã?"
        ],
        "hint": "Repetir se parece al español repetir.",
        hintSpeechSegments:["Repetir"], explanationSpeechSegments:["Pode repetir, por favor?"], "explanation": "Pode repetir, por favor? es una petición cortés y natural para pedir que repitan algo."
      },
      {
        "id": "pt-daily-04",
        "level": "A2",
        "topic": "daily",
        "skill": "Pasado simple",
        "prompt": "Completa: Ontem eu ___ ao mercado. (Ayer fui al mercado.)",
        "target": "fui",
        "term": "ontem",
        "meaning": "ayer",
        "options": [
          "fui",
          "vou",
          "irei"
        ],
        "hint": "La frase habla de ontem (ayer), así que necesita pasado.",
        hintSpeechSegments:["ontem"], explanationSpeechSegments:["Fui","Vou","irei"], "explanation": "Fui es el pasado de ir para eu. Vou es presente y irei es futuro."
      },
      {
        "id": "pt-travel-05",
        "level": "A2",
        "topic": "travel",
        "skill": "Direcciones",
        "prompt": "¿Cómo dices “Siga todo recto”?",
        "target": "Siga em frente",
        "acceptedAnswers": [
          "Vá em frente"
        ],
        "term": "em frente",
        "meaning": "hacia adelante / recto",
        "options": [
          "Siga em frente",
          "Vire à esquerda",
          "Atravesse a rua"
        ],
        "hint": "Frente se refiere a la parte delantera.",
        hintSpeechSegments:["frente"], explanationSpeechSegments:["Siga em frente"], "explanation": "Siga em frente es una instrucción habitual para continuar recto."
      }
  ]
};
