
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { UserData, WorkoutPlanType } from '../types';

// A factory function to get the AI client.
// This prevents the app from crashing on module load if the API key is missing.
// The UI in App.tsx will show a prompt instead of allowing this function to be called.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // This should ideally not be reached because of the UI check.
    throw new Error("La chiave API di Google Gemini non è configurata. Imposta la variabile d'ambiente API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { 
      type: Type.OBJECT,
      description: "Titolo del piano di allenamento, suddiviso in due parti per una formattazione specifica.",
      properties: {
        mainTitle: { type: Type.STRING, description: "Il nome del programma, es: 'RAMM' o 'Forza Ibrida'" },
        subtitle: { type: Type.STRING, description: "La descrizione del programma, es: 'Ipertrofia Avanzata in Multifrequenza 5 gg'" }
      },
      required: ["mainTitle", "subtitle"]
    },
    description: { type: Type.STRING, description: "Breve descrizione del piano di allenamento e della sua filosofia." },
    notes: { 
        type: Type.ARRAY, 
        description: "Consigli generali importanti per seguire la scheda, come l'importanza del sovraccarico progressivo, del riscaldamento e del defaticamento.",
        items: { type: Type.STRING }
    },
    plan: {
      type: Type.ARRAY,
      description: "Array contenente i piani di allenamento per ogni giorno.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "Giorno di allenamento, es: 'Giorno A' o 'Lunedì'" },
          focus: { type: Type.STRING, description: "Focus muscolare del giorno, es: 'Spinta (Petto, Spalle, Tricipiti)'" },
          exercises: {
            type: Type.ARRAY,
            description: "Elenco degli esercizi per il giorno specificato.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nome dell'esercizio, es: 'Panca Piana con Bilanciere'" },
                sets: { type: Type.STRING, description: "Numero di serie, es: '4'" },
                reps: { type: Type.STRING, description: "Intervallo di ripetizioni, es: '6-8' o '8-12'" },
                rest: { type: Type.STRING, description: "Tempo di recupero in secondi, es: '120-180s' o '90s'" },
                note: { type: Type.STRING, description: "Eventuale nota o consiglio sull'esecuzione dell'esercizio. Opzionale." }
              },
              required: ["name", "sets", "reps", "rest"]
            }
          }
        },
        required: ["day", "focus", "exercises"]
      }
    }
  },
  required: ["title", "description", "notes", "plan"]
};

export const generateWorkoutPlan = async (userData: UserData): Promise<WorkoutPlanType> => {
  const { name, gender, age, height, weight, trainingDays, goal, experience, focusMuscleGroups, trainingType, recommendedSplit, equipment, previousPlan, customSplitDescription } = userData;

  const goalMap = {
    hypertrophy: 'ipertrofia muscolare',
    strength: 'aumento della forza massima',
    fat_loss: 'definizione e ricomposizione corporea',
  };

  const experienceMap = {
    beginner: 'principiante (meno di 1 anno di esperienza)',
    intermediate: 'intermedio (1-3 anni di esperienza)',
    advanced: 'avanzato (più di 3 anni di esperienza)',
  };

  const equipmentMap = {
    gym: 'una palestra completamente attrezzata',
    homegym: 'una home gym (con rack, panca, bilanciere e manubri)',
    dumbbells_bands: 'solamente manubri di vario peso ed elastici di resistenza',
  };

  const focusMuscles = focusMuscleGroups.length > 0 ? `con un focus particolare sui seguenti gruppi muscolari: ${focusMuscleGroups.join(', ')}.` : 'in modo bilanciato su tutto il corpo.';

  let splitPreference = '';
  if (recommendedSplit === 'Chiedi a IArnold' && customSplitDescription) {
    splitPreference = `L'utente ha fornito una descrizione personalizzata della scheda che desidera. Basati su questa descrizione per creare la struttura e la selezione degli esercizi. Descrizione dell'utente: "${customSplitDescription}".`;
  } else if (recommendedSplit && recommendedSplit !== 'Lascia decidere all\'IA' && recommendedSplit !== 'Chiedi a IArnold') {
    splitPreference = `L'utente ha espresso una preferenza per una struttura di allenamento ${recommendedSplit}. Se possibile, basa la scheda su questo split, adattandolo al numero di giorni di allenamento. Se non è adatto, scegli la migliore alternativa motivando la scelta.`;
  } else {
    splitPreference = 'L\'utente non ha specificato uno split preferito, quindi scegli la struttura di allenamento (Push/Pull/Legs, Upper/Lower, Full Body, ecc.) che ritieni più ottimale in base ai suoi dati.';
  }

  let previousPlanContext = '';
  if (previousPlan) {
    if (previousPlan.type === 'text') {
        previousPlanContext = `L'utente ha allegato la sua scheda precedente in formato testo per darti contesto. Analizzala attentamente per capire la struttura, gli esercizi e i volumi. Il tuo compito è creare una NUOVA scheda che sia una progressione logica o una valida alternativa a quella fornita. Non copiare la vecchia scheda, ma usala come ispirazione per la progressione. Ecco il contenuto della vecchia scheda:\n\n---\n${previousPlan.content}\n---`;
    } else { // image
        previousPlanContext = `IMPORTANTISSIMO: L'utente ha allegato un'IMMAGINE della sua scheda precedente. Analizzala attentamente per capire la struttura, gli esercizi e i volumi. Il tuo compito è creare una NUOVA scheda che sia una progressione logica o una valida alternativa a quella fornita, mantenendo tutti i principi richiesti. Non copiare la vecchia scheda, ma usala come base per creare la progressionzione.`;
    }
  }

  const prompt = `
    Sei "IArnold", un personal trainer AI di livello mondiale, esperto in ipertrofia e forza, ispirato dalle metodologie di allenamento basate sulla scienza e ottimizzate per risultati concreti, come quelle divulgate da Edoardo Baldini.

    Il tuo compito è creare una scheda di allenamento personalizzata in formato JSON per un utente di nome "${name || 'Atleta'}" con le seguenti caratteristiche:
    - Sesso: ${gender}
    - Età: ${age} anni
    - Altezza: ${height} cm
    - Peso: ${weight} kg
    - Livello di esperienza: ${experienceMap[experience]}
    - Attrezzatura disponibile: ${equipmentMap[equipment]}
    - Giorni di allenamento a settimana: ${trainingDays}
    - Obiettivo principale: ${goalMap[goal]}
    - Tipologia di allenamento preferita: ${trainingType}

    L'utente desidera un allenamento completo per tutto il corpo, ${focusMuscles}
    ${splitPreference}
    ${previousPlanContext}

    REGOLE FONDAMENTALI DA SEGUIRE PER LA CREAZIONE DELLA SCHEDA:
    1.  **Formato Titolo:** Il titolo deve avere un nome principale (mainTitle) e un sottotitolo descrittivo (subtitle).
    2.  **Volume Settimanale:** Il volume totale per ogni gruppo muscolare NON DEVE SUPERARE le 10 serie allenanti a settimana. Sii preciso e rigoroso su questo punto.
    3.  **Rep Range:**
        - Per i primi 1-2 esercizi fondamentali di ogni sessione (es. Panca Piana, Squat, Stacco, Trazioni, Military Press), imposta un range di ripetizioni tra 4 e 8.
        - Per tutti gli altri esercizi complementari e di isolamento, usa un range tra 8 e 15 ripetizioni.
    4.  **Recupero:**
        - Per gli esercizi nel range 4-8 reps, imposta un recupero tra 120 e 180 secondi.
        - Per gli esercizi nel range 8-15 reps, imposta un recupero tra 60 e 120 secondi.
    5.  **Selezione Esercizi:** Privilegia esercizi multi-articolari adatti all'attrezzatura disponibile.
    6.  **Stabilità degli Esercizi (REGOLA CRITICA):** Per i livelli PRINCIPIANTE e INTERMEDIO, dai priorità a esercizi con maggiore stabilità. Ad esempio, preferisci varianti su macchinari (es. Chest Press, Leg Press) o esercizi ai cavi rispetto a varianti complesse con peso libero (es. Panca piana con manubri). Per il livello AVANZATO, puoi includere esercizi più complessi che richiedono maggiore stabilizzazione.
    7.  **Struttura:** Organizza la scheda in giorni (es. Giorno A, Giorno B...). Per ogni esercizio, specifica nome, serie, ripetizioni, e recupero. Aggiungi brevi note tecniche dove rilevante (es. 'Focus sulla contrazione di picco', 'Movimento controllato in negativa').
    8.  **Note Generali:** Includi una sezione "notes" con 2-3 consigli chiave, sottolineando l'importanza del SOVRACCARICO PROGRESSIVO (cercare di aumentare il carico o le ripetizioni nel tempo) come vero motore della crescita.

    Fornisci l'output ESCLUSIVAMENTE in formato JSON, seguendo lo schema fornito. Non aggiungere testo o spiegazioni al di fuori del JSON.
  `;

  try {
    const ai = getAiClient();
    const parts: any[] = [{ text: prompt }];

    if (previousPlan && previousPlan.type === 'image') {
      parts.push({
        inlineData: {
          mimeType: previousPlan.mimeType!,
          data: previousPlan.content,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const plan = JSON.parse(jsonString) as WorkoutPlanType;
    return plan;

  } catch (error) {
    console.error("Errore durante la chiamata all'API Gemini:", error);
    throw new Error("Impossibile generare la scheda di allenamento. Riprova più tardi.");
  }
};

const searchYoutubeTool: FunctionDeclaration = {
  name: "searchYoutube",
  description: "Cerca un video su YouTube e restituisce l'URL dei risultati di ricerca.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "I termini da cercare, ad esempio il nome di un esercizio di allenamento.",
      },
    },
    required: ["query"],
  },
};

export async function askAboutWorkoutPlan(
  plan: WorkoutPlanType,
  question: string
): Promise<string> {
  try {
    const ai = getAiClient();

    const planContext = JSON.stringify(plan, null, 2);

    const prompt = `
      Sei "IArnold", il personal trainer AI che ha creato la scheda di allenamento fornita.
      Il tuo compito è rispondere alle domande dell'utente relative ESCLUSIVAMENTE alla scheda fornita e a concetti generali di allenamento.
      Se l'utente ti chiede di mostrargli un video o come si fa un esercizio, USA lo strumento 'searchYoutube' per fornirgli un link.
      Sii conciso, utile e mantieni il tuo tono da esperto di fitness.

      **CONTESTO (La scheda di allenamento che hai creato):**
      \`\`\`json
      ${planContext}
      \`\`\`

      **DOMANDA DELL'UTENTE:**
      "${question}"

      Rispondi alla domanda basandoti sulle informazioni della scheda e sulla tua conoscenza generale.
    `;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [searchYoutubeTool] }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (functionCall.name === 'searchYoutube') {
        const query = functionCall.args.query;
        if (typeof query === 'string') {
          const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          // Return a user-friendly markdown link
          return `Certo! Ecco un link per cercare tutorial su "${query}" su YouTube: [Guarda i video dell'esercizio](${url})`;
        }
      }
    }
    
    // If no function call, or if it fails, return the text response
    return response.text;

  } catch (error) {
    console.error("Errore durante la chat con l'API Gemini:", error);
    return "Mi dispiace, si è verificato un errore e non posso rispondere in questo momento.";
  }
}

const alternativesSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

export const getExerciseAlternatives = async (exerciseToReplace: string, muscleGroupFocus: string, equipment: 'gym' | 'homegym' | 'dumbbells_bands'): Promise<string[]> => {
    const equipmentMap = {
        gym: 'una palestra completamente attrezzata',
        homegym: 'una home gym (con rack, panca, bilanciere e manubri)',
        dumbbells_bands: 'solamente manubri di vario peso ed elastici di resistenza',
    };

    const prompt = `
        Sei un esperto personal trainer AI. L'utente vuole sostituire l'esercizio "${exerciseToReplace}".
        Il focus muscolare del giorno è: "${muscleGroupFocus}".
        L'attrezzatura a disposizione è: "${equipmentMap[equipment]}".

        Suggerisci 5 esercizi alternativi che allenino lo stesso gruppo muscolare target, compatibili con l'attrezzatura.
        Non includere "${exerciseToReplace}" nella lista.
        Fornisci l'output ESCLUSIVAMENTE in formato JSON, come un array di stringhe.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: alternativesSchema,
            },
        });
        const jsonString = response.text.trim();
        const alternatives = JSON.parse(jsonString) as string[];
        return alternatives;
    } catch (error) {
        console.error("Errore nel generare alternative per l'esercizio:", error);
        // Return a fallback list on error
        return ["Non è stato possibile trovare alternative, riprova."];
    }
};
