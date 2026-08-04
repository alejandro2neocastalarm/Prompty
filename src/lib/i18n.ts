export const LANGUAGES = [
  { code: "es", label: "ES", name: "Español" },
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "pt", label: "PT", name: "Português" },
  { code: "de", label: "DE", name: "Deutsch" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export type Dict = {
  tagline1: string;
  taglineHighlight: string;
  subtitle: string;
  inputLabel: string;
  placeholder: string;
  image: string;
  file: string;
  more: string;
  model: string;
  generate: string;
  generating: string;
  thinking: string;
  questionsTitle: string;
  questionsHint: string;
  answerPlaceholder: string;
  skip: string;
  continueBtn: string;
  resultTitle: string;
  copy: string;
  copied: string;
  regenerate: string;
  reset: string;
  history: string;
  historyEmpty: string;
  clear: string;
  dropHere: string;
  errorEmpty: string;
  errorGeneric: string;
  errorRate: string;
  errorCredits: string;
  attachments: string;
  langName: string;
};

export const DICTS: Record<LangCode, Dict> = {
  es: {
    tagline1: "Convierte tu idea en el",
    taglineHighlight: "prompt perfecto",
    subtitle:
      "Describe lo que necesitas, sube archivos o imágenes y deja que la IA genere el prompt ideal para el modelo que elijas.",
    inputLabel: "¿Qué quieres que haga la IA?",
    placeholder:
      "Ej: Crea una ilustración de un paisaje futurista al atardecer con rascacielos y vehículos voladores...",
    image: "Imagen",
    file: "Archivo",
    more: "Más",
    model: "Modelo",
    generate: "Generar Prompt",
    generating: "Generando...",
    thinking: "Prompty está pensando...",
    questionsTitle: "Afinemos tu prompt",
    questionsHint: "Responde lo que quieras. Puedes dejar respuestas en blanco.",
    answerPlaceholder: "Tu respuesta...",
    skip: "Omitir preguntas",
    continueBtn: "Crear prompt",
    resultTitle: "Tu prompt",
    copy: "Copiar",
    copied: "¡Copiado!",
    regenerate: "Regenerar",
    reset: "Nuevo",
    history: "Historial",
    historyEmpty: "Todavía no hay prompts guardados.",
    clear: "Borrar",
    dropHere: "Suelta tus archivos aquí",
    errorEmpty: "Escribe primero qué quieres que haga la IA.",
    errorGeneric: "Algo ha fallado. Inténtalo de nuevo.",
    errorRate: "Demasiadas peticiones. Espera unos segundos.",
    errorCredits: "Sin créditos de IA disponibles.",
    attachments: "Adjuntos",
    langName: "Idioma",
  },
  en: {
    tagline1: "Turn your idea into the",
    taglineHighlight: "perfect prompt",
    subtitle:
      "Describe what you need, upload files or images, and let AI craft the ideal prompt for the model you pick.",
    inputLabel: "What do you want the AI to do?",
    placeholder:
      "E.g. Create an illustration of a futuristic landscape at sunset with skyscrapers and flying vehicles...",
    image: "Image",
    file: "File",
    more: "More",
    model: "Model",
    generate: "Generate Prompt",
    generating: "Generating...",
    thinking: "Prompty is thinking...",
    questionsTitle: "Let's sharpen your prompt",
    questionsHint: "Answer what you like. Blank answers are fine.",
    answerPlaceholder: "Your answer...",
    skip: "Skip questions",
    continueBtn: "Create prompt",
    resultTitle: "Your prompt",
    copy: "Copy",
    copied: "Copied!",
    regenerate: "Regenerate",
    reset: "New",
    history: "History",
    historyEmpty: "No saved prompts yet.",
    clear: "Clear",
    dropHere: "Drop your files here",
    errorEmpty: "First describe what you want the AI to do.",
    errorGeneric: "Something went wrong. Try again.",
    errorRate: "Too many requests. Wait a few seconds.",
    errorCredits: "No AI credits available.",
    attachments: "Attachments",
    langName: "Language",
  },
  fr: {
    tagline1: "Transformez votre idée en",
    taglineHighlight: "prompt parfait",
    subtitle:
      "Décrivez votre besoin, importez des fichiers ou des images et laissez l'IA créer le prompt idéal pour le modèle choisi.",
    inputLabel: "Que voulez-vous que l'IA fasse ?",
    placeholder:
      "Ex : Crée une illustration d'un paysage futuriste au coucher du soleil avec des gratte-ciels...",
    image: "Image",
    file: "Fichier",
    more: "Plus",
    model: "Modèle",
    generate: "Générer le prompt",
    generating: "Génération...",
    thinking: "Prompty réfléchit...",
    questionsTitle: "Affinons votre prompt",
    questionsHint: "Répondez librement. Les réponses vides sont acceptées.",
    answerPlaceholder: "Votre réponse...",
    skip: "Passer les questions",
    continueBtn: "Créer le prompt",
    resultTitle: "Votre prompt",
    copy: "Copier",
    copied: "Copié !",
    regenerate: "Régénérer",
    reset: "Nouveau",
    history: "Historique",
    historyEmpty: "Aucun prompt enregistré.",
    clear: "Effacer",
    dropHere: "Déposez vos fichiers ici",
    errorEmpty: "Décrivez d'abord ce que l'IA doit faire.",
    errorGeneric: "Une erreur est survenue. Réessayez.",
    errorRate: "Trop de requêtes. Patientez quelques secondes.",
    errorCredits: "Plus de crédits IA disponibles.",
    attachments: "Pièces jointes",
    langName: "Langue",
  },
  pt: {
    tagline1: "Transforme a sua ideia no",
    taglineHighlight: "prompt perfeito",
    subtitle:
      "Descreva o que precisa, carregue ficheiros ou imagens e deixe a IA criar o prompt ideal para o modelo escolhido.",
    inputLabel: "O que quer que a IA faça?",
    placeholder:
      "Ex: Cria uma ilustração de uma paisagem futurista ao pôr do sol com arranha-céus...",
    image: "Imagem",
    file: "Ficheiro",
    more: "Mais",
    model: "Modelo",
    generate: "Gerar Prompt",
    generating: "A gerar...",
    thinking: "Prompty está a pensar...",
    questionsTitle: "Vamos afinar o seu prompt",
    questionsHint: "Responda o que quiser. Pode deixar em branco.",
    answerPlaceholder: "A sua resposta...",
    skip: "Ignorar perguntas",
    continueBtn: "Criar prompt",
    resultTitle: "O seu prompt",
    copy: "Copiar",
    copied: "Copiado!",
    regenerate: "Regenerar",
    reset: "Novo",
    history: "Histórico",
    historyEmpty: "Ainda não há prompts guardados.",
    clear: "Limpar",
    dropHere: "Largue os ficheiros aqui",
    errorEmpty: "Descreva primeiro o que quer que a IA faça.",
    errorGeneric: "Algo correu mal. Tente novamente.",
    errorRate: "Demasiados pedidos. Aguarde uns segundos.",
    errorCredits: "Sem créditos de IA disponíveis.",
    attachments: "Anexos",
    langName: "Idioma",
  },
  de: {
    tagline1: "Verwandle deine Idee in den",
    taglineHighlight: "perfekten Prompt",
    subtitle:
      "Beschreibe, was du brauchst, lade Dateien oder Bilder hoch und lass die KI den idealen Prompt für dein Modell erstellen.",
    inputLabel: "Was soll die KI tun?",
    placeholder:
      "Z. B.: Erstelle eine Illustration einer futuristischen Landschaft bei Sonnenuntergang...",
    image: "Bild",
    file: "Datei",
    more: "Mehr",
    model: "Modell",
    generate: "Prompt generieren",
    generating: "Wird generiert...",
    thinking: "Prompty denkt nach...",
    questionsTitle: "Lass uns den Prompt schärfen",
    questionsHint: "Beantworte, was du möchtest. Leere Antworten sind okay.",
    answerPlaceholder: "Deine Antwort...",
    skip: "Fragen überspringen",
    continueBtn: "Prompt erstellen",
    resultTitle: "Dein Prompt",
    copy: "Kopieren",
    copied: "Kopiert!",
    regenerate: "Neu generieren",
    reset: "Neu",
    history: "Verlauf",
    historyEmpty: "Noch keine gespeicherten Prompts.",
    clear: "Löschen",
    dropHere: "Dateien hier ablegen",
    errorEmpty: "Beschreibe zuerst, was die KI tun soll.",
    errorGeneric: "Etwas ist schiefgelaufen. Versuch es erneut.",
    errorRate: "Zu viele Anfragen. Warte einen Moment.",
    errorCredits: "Keine KI-Credits verfügbar.",
    attachments: "Anhänge",
    langName: "Sprache",
  },
};

export const LANG_NAMES: Record<LangCode, string> = {
  es: "Spanish",
  en: "English",
  fr: "French",
  pt: "Portuguese",
  de: "German",
};
