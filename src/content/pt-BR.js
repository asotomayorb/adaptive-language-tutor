export const ptBR = {
  id: "pt-BR",
  label: "Portugués brasileño",
  locale: "pt-BR",
  exercises: [
    { id:"pt-greet-01", level:"A1", topic:"daily", skill:"Comprensión auditiva", instruction:"Escucha la frase en portugués y elige su significado en español.", prompt:"Bom dia", promptLocale:"pt-BR", target:"Buenos días", term:"Bom dia", meaning:"Buenos días", options:["Buenas noches","Buenos días","Hasta luego"], speechText:"Bom dia", speechLocale:"pt-BR", speechMode:"listening", hint:"Es un saludo que se utiliza durante la mañana.", hintSpeechSegments:[], explanationSpeechSegments:["Bom dia"], explanation:"Bom dia significa Buenos días y se utiliza durante la mañana." },
    { id:"pt-verb-01", level:"A1", topic:"daily", skill:"Verbo ser", instruction:"Completa la frase:", prompt:"Eu ___ chileno.", promptLocale:"pt-BR", target:"sou", term:"sou", meaning:"soy", options:["sou","estou","é"], hint:"Para identidad u origen, usa el verbo ser.", hintSpeechSegments:[], explanationSpeechSegments:["Eu sou","Estou"], explanation:"Eu sou significa yo soy. Estou suele expresar estado o ubicación." },
    { id:"pt-travel-01", level:"A1", topic:"travel", skill:"Preguntas útiles", instruction:"¿Cómo se pregunta esto en portugués?", prompt:"¿Dónde está el baño?", promptLocale:"es-CL", target:"Onde fica o banheiro?", acceptedAnswers:["Onde está o banheiro?"], term:"banheiro", meaning:"baño", options:["Quanto custa?","Onde fica o banheiro?","Que horas são?"], hint:"Empieza con Onde (dónde).", hintSpeechSegments:["Onde"], explanationSpeechSegments:["Onde fica"], explanation:"Onde fica...? pregunta dónde se encuentra algo." },
    { id:"pt-food-01", level:"A1", topic:"food", skill:"Pedir comida", instruction:"¿Qué expresión usarías en portugués para pedir esto?", prompt:"Quisiera un café.", promptLocale:"es-CL", target:"Eu gostaria de um café", acceptedAnswers:["Gostaria de um café"], term:"café", meaning:"café", options:["Eu gostaria de um café","Estou com fome","A conta, por favor"], hint:"Gostaria es una forma cortés de pedir.", hintSpeechSegments:["Gostaria"], explanationSpeechSegments:["Eu gostaria de"], explanation:"Eu gostaria de... equivale a quisiera..." },
    { id:"pt-work-01", level:"A1", topic:"work", skill:"Presentaciones", prompt:"Completa: Meu nome ___ Ana.", target:"é", term:"nome", meaning:"nombre", options:["sou","é","estou"], hint:"Meu nome significa mi nombre.", hintSpeechSegments:["Meu nome"], explanationSpeechSegments:["Meu nome é"], explanation:"Meu nome é... significa Mi nombre es..." },
    { id:"pt-greet-02", level:"A2", topic:"daily", skill:"Conversación", prompt:"¿Cómo respondes “Muito prazer” (mucho gusto)?", speechSegments:[{text:"¿Cómo respondes",locale:"es-CL"},{text:"Muito prazer",locale:"pt-BR"}], target:"O prazer é meu", acceptedAnswers:["Prazer é meu"], term:"O prazer é meu", meaning:"El gusto es mío", options:["O prazer é meu","Até amanhã","Com licença"], hint:"La respuesta expresa que el placer también es tuyo.", hintSpeechSegments:[], explanationSpeechSegments:["O prazer é meu"], explanation:"O prazer é meu es una respuesta natural a Muito prazer." },
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
        "finalPractice": true,
        "prompt": "Traduce al portugués esta frase concreta: «Necesito una habitación para dos personas».",
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
        "finalPractice": true,
        "prompt": "Traduce al portugués esta frase concreta: «Sin cebolla, por favor».",
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
        "finalPractice": true,
        "prompt": "Traduce al portugués esta frase concreta: «¿Puede repetir, por favor?».",
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
        "skill": "Traducción de frase en pasado",
        "prompt": "Traduce al portugués esta frase concreta: «Ayer fui al mercado».",
        "target": "Ontem fui ao mercado.",
        "acceptedAnswers": ["Ontem eu fui ao mercado."],
        "finalPractice": true,
        "term": "ontem",
        "meaning": "ayer",
        "options": [
          "Ontem fui ao mercado.",
          "Ontem vou ao mercado.",
          "Amanhã irei ao mercado."
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
      },
{id:"pt-reading-a1-01",type:"reading",term:"texto",meaning:"comprensión lectora",hintSpeechSegments:[],explanationSpeechSegments:[],level:"A1",topic:"reading",skill:"Comprensión literal",passageTitle:"Um dia de Ana",passage:"Ana mora em João Pessoa. Ela acorda às sete horas e toma café da manhã em casa. Depois, vai à universidade de ônibus. À tarde, estuda português com uma amiga. À noite, janta com a família.",prompt:"¿Dónde vive Ana?",promptLocale:"es-CL",optionsLocale:"es-CL",target:"En João Pessoa",options:["En João Pessoa","En Santiago","En São Paulo"],hint:"Busca la primera información del texto.",explanation:"El texto indica que Ana vive en João Pessoa."},
{id:"pt-reading-a1-02",type:"reading",term:"texto",meaning:"comprensión lectora",hintSpeechSegments:[],explanationSpeechSegments:[],level:"A1",topic:"reading",skill:"Comprensión literal",passageTitle:"Um dia de Ana",passage:"Ana mora em João Pessoa. Ela acorda às sete horas e toma café da manhã em casa. Depois, vai à universidade de ônibus. À tarde, estuda português com uma amiga. À noite, janta com a família.",prompt:"¿Cómo va Ana a la universidad?",promptLocale:"es-CL",optionsLocale:"es-CL",target:"En autobús",options:["En autobús","En bicicleta","A pie"],hint:"Busca el medio de transporte mencionado.",explanation:"Ana vai à universidade de ônibus (va a la universidad en autobús)."},
{id:"pt-reading-a1-03",type:"reading",term:"texto",meaning:"comprensión lectora",hintSpeechSegments:[],explanationSpeechSegments:[],level:"A1",topic:"reading",skill:"Comprensión literal",passageTitle:"Um dia de Ana",passage:"Ana mora em João Pessoa. Ela acorda às sete horas e toma café da manhã em casa. Depois, vai à universidade de ônibus. À tarde, estuda português com uma amiga. À noite, janta com a família.",prompt:"¿Con quién cena Ana?",promptLocale:"es-CL",optionsLocale:"es-CL",target:"Con su familia",options:["Con su familia","Con sus compañeros","Sola"],hint:"Busca la actividad que realiza por la noche.",explanation:"À noite, Ana janta com a família (por la noche cena con su familia)."},
{id:"pt-reading-a2-01",type:"reading",term:"texto",meaning:"comprensión lectora",hintSpeechSegments:[],explanationSpeechSegments:[],level:"A2",topic:"reading",skill:"Inferencia sencilla",passageTitle:"Uma mudança de planos",passage:"Marcos planejava passar o sábado na praia com a irmã, mas a previsão indicou chuva durante toda a manhã e possibilidade de vento forte à tarde. Como já tinham reservado o dia para sair, ele procurou uma alternativa que não dependesse do clima e decidiu visitar um museu no centro histórico. Antes de sair, comprou os ingressos pela internet e enviou à irmã o horário e o endereço. Eles combinaram de se encontrar na entrada às onze. Depois da visita, pretendem almoçar em um restaurante próximo; se o tempo melhorar, talvez caminhem pela orla.",prompt:"¿Por qué Marcos cambió sus planes?",promptLocale:"es-CL",optionsLocale:"es-CL",target:"Porque se pronosticó lluvia",options:["Porque se pronosticó lluvia","Porque el museo estaba cerrado","Porque su hermana no podía ir"],hint:"Relaciona la previsión del tiempo con la decisión.",explanation:"La previsión indicó lluvia durante la mañana, por eso Marcos eligió visitar un museo."},
{id:"pt-reading-a2-02",type:"reading",term:"texto",meaning:"comprensión lectora",hintSpeechSegments:[],explanationSpeechSegments:[],level:"A2",topic:"reading",skill:"Comprensión de detalles",passageTitle:"Uma mudança de planos",passage:"Marcos planejava passar o sábado na praia com a irmã, mas a previsão indicou chuva durante toda a manhã e possibilidade de vento forte à tarde. Como já tinham reservado o dia para sair, ele procurou uma alternativa que não dependesse do clima e decidiu visitar um museu no centro histórico. Antes de sair, comprou os ingressos pela internet e enviou à irmã o horário e o endereço. Eles combinaram de se encontrar na entrada às onze. Depois da visita, pretendem almoçar em um restaurante próximo; se o tempo melhorar, talvez caminhem pela orla.",prompt:"¿A qué hora acordó encontrarse con su hermana?",promptLocale:"es-CL",optionsLocale:"es-CL",target:"A las once",options:["A las nueve","A las once","A las doce"],hint:"Busca la hora indicada en el texto.",explanation:"Marcos combinó encontrar a sua irmã na entrada às onze (a las once)."},
{id:"pt-reading-a2-03",type:"reading",term:"texto",meaning:"comprensión lectora",hintSpeechSegments:[],explanationSpeechSegments:[],level:"A2",topic:"reading",skill:"Vocabulario contextual",passageTitle:"Uma mudança de planos",passage:"Marcos planejava passar o sábado na praia com a irmã, mas a previsão indicou chuva durante toda a manhã e possibilidade de vento forte à tarde. Como já tinham reservado o dia para sair, ele procurou uma alternativa que não dependesse do clima e decidiu visitar um museu no centro histórico. Antes de sair, comprou os ingressos pela internet e enviou à irmã o horário e o endereço. Eles combinaram de se encontrar na entrada às onze. Depois da visita, pretendem almoçar em um restaurante próximo; se o tempo melhorar, talvez caminhem pela orla.",prompt:"En este contexto, ¿qué significa «orla»?",promptLocale:"es-CL",optionsLocale:"es-CL",target:"Paseo o zona junto al mar",options:["Paseo o zona junto al mar","Una estación de tren","Una sala del museo"],hint:"La frase dice que caminarían por la orla si mejora el tiempo.",explanation:"Orla se refiere aquí al paseo o zona costera junto al mar."}
  ]
};
