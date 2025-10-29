
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { UserData, WorkoutPlanType, HistoryEntry } from '../types';

// A factory function to get the AI client.
// This prevents the app from crashing on module load if the API key is missing.
const getAiClient = () => {
  // Vite exposes env variables through `import.meta.env`
  // Variables prefixed with VITE_ are exposed to the client-side code.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    // This should ideally not be reached because of the UI check in App.tsx.
    throw new Error("La chiave API di Google Gemini non è configurata. Imposta la variabile d'ambiente VITE_GEMINI_API_KEY.");
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
                note: { type: Type.STRING, description: "Eventuale nota o consiglio sull'esecuzione, INCLUSA la nota di progressione se applicabile (es. 'Obiettivo: 82.5kg (+2.5kg)'). Opzionale." }
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

export const generateWorkoutPlan = async (userData: UserData, lastWorkout: HistoryEntry | null = null): Promise<WorkoutPlanType> => {
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
    splitPreference = `L'utente ha espresso una preferenza per una struttura di allenamento ${recommendedSplit}. DEVI categoricamente basare la scheda su questo split, adattandolo al numero di giorni di allenamento. La sua scelta ha la priorità assoluta e non devi scegliere un'alternativa.`;
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
  
  let progressionContext = '';
    if (lastWorkout) {
    progressionContext = `
    **ANALISI DELLA PERFORMANCE PRECEDENTE E PROGRESSIONE (REGOLA CRITICA):**
    Questa non è una prima scheda. L'utente ha completato il ciclo di allenamento precedente e ha registrato le sue performance. Il tuo compito ora è quello più importante: agire come un vero coach e applicare il **SOVRACCARICO PROGRESSIVO**.
    
    Ecco i dati dell'ultima scheda completata:
    - Piano originale: ${JSON.stringify(lastWorkout.plan.plan)}
    - Dati tracciati dall'utente (pesi e note): ${JSON.stringify(lastWorkout.trackedData)}

    **TUE ISTRUZIONI PER LA PROGRESSIONE:**
    1.  **Analizza i \`trackedData\`:** Per ogni esercizio dove l'utente ha registrato un peso, valuta la sua performance.
    2.  **Applica il Sovraccarico Progressivo:**
        - Se l'utente ha raggiunto o superato il target di ripetizioni con un dato peso, **aumenta leggermente il carico** per quell'esercizio nella nuova scheda (es. +2.5kg per esercizi fondamentali, +1/2kg per manubri, +una piastra su macchine).
        - Se l'utente NON ha raggiunto il target di ripetizioni, mantieni lo stesso carico ma cerca di aumentare le ripetizioni, oppure mantieni lo stesso schema serie x reps per consolidare.
        - Se non ci sono dati tracciati per un esercizio, assumi che sia stato completato come da programma e applica una leggera progressione.
    3.  **Annota la Progressione:** Per gli esercizi chiave in cui hai applicato una progressione, aggiungi una nota chiara nel campo "note" dell'esercizio. Esempio: "note": "Obiettivo: 82.5kg (+2.5kg rispetto alla scorsa volta)". Questo è FONDAMENTALE per guidare l'utente.
    4.  **Mantieni la Struttura:** La nuova scheda dovrebbe essere un'evoluzione della precedente. Mantieni una struttura simile, ma puoi variare alcuni esercizi complementari per fornire un nuovo stimolo, sempre rispettando le preferenze e l'attrezzatura dell'utente.
    `;
  }

  const prompt = `
    Sei "IArnold", un personal trainer AI di livello mondiale, esperto in ipertrofia e forza, ispirato dalle metodologie di allenamento basate sulla scienza e ottimizzate per risultati concreti.

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

    **Adatta la selezione degli esercizi e il focus in base al sesso dell'utente:**
    - **Uomo:** Dai priorità e volume a petto, spalle, dorso e quadricipiti.
    - **Donna:** Dai priorità e volume a glutei, bicipiti femorali, dorso e spalle.

    L'utente desidera un allenamento completo per tutto il corpo, ${focusMuscles}
    ${splitPreference}
    ${previousPlanContext}
    ${progressionContext}

    REGOLE FONDAMENTALI DA SEGUIRE PER LA CREAZIONE DELLA SCHEDA:
    1.  **Formato Titolo:** Il titolo deve avere un nome principale (mainTitle) e un sottotitolo descrittivo (subtitle). Se stai creando una progressione, puoi specificarlo nel titolo, es. "Fase 2".
    2.  **Modulazione per Età (REGOLA CRITICA):** L'età è un fattore chiave. Modula il volume e l'intensità di conseguenza:
        - Per utenti **over 45**, considera una leggera riduzione del volume totale (numero di serie) o un aumento dei tempi di recupero per favorire il recupero e la sostenibilità a lungo termine.
        - Per utenti **under 20**, privilegia l'apprendimento della tecnica corretta con carichi moderati rispetto al sollevamento di carichi massimali.
    3.  **Selezione Esercizi e Biomeccanica (REGOLA CRITICA):**
        - **Stabilità:** Per i livelli PRINCIPIANTE e INTERMEDIO, dai assoluta priorità a esercizi con maggiore stabilità (es. Chest Press, Leg Press, varianti ai cavi) rispetto a varianti complesse con peso libero. Per il livello AVANZATO, puoi includere una combinazione bilanciata.
        - **Priorità alla Contrazione:** L'utente richiede esplicitamente di prediligere esercizi dove lo sforzo massimo avviene durante la fase di contrazione (es. Leg Extension, Cable Crossover, Peck Deck) e non durante la fase di massimo allungamento. Evita esercizi che caricano pesantemente il muscolo in allungamento, se non per atleti avanzati.
    4.  **Volume Settimanale (REGOLA CRITICA E NON NEGOZIABILE):** Il volume totale per ogni singolo gruppo muscolare **NON DEVE ASSOLUTAMENTE SUPERARE le 10 serie allenanti a settimana**. Controlla attentamente il totale delle serie per muscolo (es. Petto, Dorso, etc.) sommando tutte le sessioni della settimana. Questa è una regola fondamentale per la sostenibilità del piano.
    5.  **Recupero Muscolare (REGOLA CRITICA E NON NEGOZIABILE):** Un gruppo muscolare deve avere almeno 48 ore di riposo completo prima di essere allenato di nuovo. In pratica, questo significa che se un muscolo viene allenato oggi, deve riposare completamente domani, e può essere allenato di nuovo solo il giorno successivo (un giorno sì, un giorno no). Ad esempio, se il Giorno A allena il petto, il petto NON PUÒ essere allenato di nuovo nel Giorno B se i giorni sono consecutivi. Organizza gli split (es. Push/Pull/Legs, Upper/Lower) in modo da rispettare categoricamente questa regola, specialmente per gli allenamenti in multifrequenza.
    6.  **Volume per Sessione (REGOLA CRITICA):** Il numero totale di serie allenanti per ogni singola sessione non deve superare le 15 serie.
    7.  **Rep Range (REGOLA CRITICA E NON NEGOZIABILE):** Il numero massimo di ripetizioni per serie **NON DEVE ASSOLUTAMENTE SUPERARE 12**, fatta eccezione per gli esercizi dedicati all'addome. Sii estremamente rigoroso su questo punto. Per i primi 1-2 esercizi fondamentali di ogni sessione (es. Panca Piana, Squat), imposta un range di ripetizioni tra 4 e 8. Per tutti gli altri esercizi, usa un range tra 8 e 12 ripetizioni.
    8.  **Recupero:**
        - Per gli esercizi nel range 4-8 reps, imposta un recupero tra 120 e 180 secondi.
        - Per gli esercizi nel range 8-12 reps, imposta un recupero tra 60 e 120 secondi.
    9.  **Struttura:** Organizza la scheda in giorni (es. Giorno A, Giorno B...). Per ogni esercizio, specifica nome, serie, ripetizioni, e recupero.
    10. **Note Generali:** Includi una sezione "notes" con 2-3 consigli chiave, sottolineando l'importanza del SOVRACCARICO PROGRESSIVO (cercare di aumentare il carico o le ripetizioni nel tempo) come vero motore della crescita.
    11. **Tecniche di Intensità:** Includi tecniche di intensità appropriate nel campo "note" di alcuni esercizi. Prediligi tecniche come l'**isotensione** (contrazione di picco per 1-2 secondi), il movimento lento e controllato, o pause a metà movimento. Esempio di nota: "Isotensione: mantieni la massima contrazione per 2 secondi in cima al movimento."
    12. **Nomenclatura Esercizi (REGOLA CRITICA E NON NEGOZIABILE):** Presta la massima attenzione alla correttezza dei nomi degli esercizi in italiano. Usa terminologia standard e precisa. Ad esempio, "Croci ai cavi" è corretto, "Crocifisso al cavo" è un errore. Se non sei assolutamente sicuro della traduzione o del nome corretto in italiano, USA IL NOME IN INGLESE (es. "Cable Crossover", "Lat Pulldown"). La precisione è più importante della traduzione.

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

export const generateWorkoutSummary = async (entry: HistoryEntry): Promise<string> => {
    const { plan, trackedData, userData } = entry;

    const prompt = `
        Sei "IArnold", un personal trainer AI motivazionale e competente. L'utente, ${userData.name}, ha appena completato un allenamento.
        Il tuo compito è fornirgli un breve (massimo 3-4 frasi) riepilogo motivazionale della sua performance. Sii positivo, incoraggiante e fai riferimento a un dato specifico della sua sessione per rendere il feedback più personale.

        **Dati dell'allenamento:**
        - **Piano:** ${JSON.stringify(plan.plan)}
        - **Dati registrati dall'utente (pesi e note):** ${JSON.stringify(trackedData)}

        **Istruzioni per il riepilogo:**
        1.  Inizia con un saluto energico e complimentati per aver completato l'allenamento.
        2.  Trova un esercizio in cui l'utente ha registrato un peso significativo o una nota di progressione e menzionalo. Ad esempio: "Hai spinto alla grande sulla Panca Piana oggi!" o "Ottimo lavoro con quel nuovo carico sullo Squat!".
        3.  Concludi con una frase motivazionale che lo spinga a continuare e a riposare bene.
        4.  Mantieni un tono da coach: diretto, positivo e di supporto. Non usare un linguaggio troppo formale o robotico.

        Esempio di output desiderato: "Grande allenamento, ${userData.name}! Hai dato il massimo, specialmente con quegli 80kg di Panca Piana. Continua con questa determinazione e i risultati non tarderanno ad arrivare. Ora recupera, te lo sei meritato!"

        Genera solo il testo del riepilogo, senza nient'altro.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Errore nel generare il riepilogo:", error);
        throw new Error("Impossibile generare il riepilogo dell'allenamento.");
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