import { GoogleGenAI } from '@google/genai';
import { Question } from './db';

export async function generateAIQuestions(params: {
  topic: 'quantitative' | 'logical' | 'verbal' | 'data_interpretation';
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}): Promise<Question[]> {
  const { topic, difficulty, count } = params;
  const safeCount = Math.min(10, Math.max(1, count || 3));

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({});
      const prompt = `You are a premier senior technical and aptitude assessment designer for corporate campus placements (such as TCS NQT, Infosys, Deloitte, Google, Microsoft, Goldman Sachs).
Generate exactly ${safeCount} high-quality, realistic aptitude multiple-choice questions for college placement practice.

Topic: ${topic}
Difficulty: ${difficulty}

Rules:
1. Provide exactly 4 distinct answer options for each question.
2. Specify the correct answer as an integer index (0, 1, 2, or 3).
3. Include a concise, insightful explanation solving the problem step-by-step.
4. For Data Interpretation questions, optionally provide a small 2-4 row tabular dataset with headers and rows.
5. Return strictly valid JSON array of objects conforming to this schema:
[
  {
    "text": "Question statement...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "explanation": "Clear step-by-step solution...",
    "table": {
      "headers": ["Col 1", "Col 2"],
      "rows": [["val 1", "val 2"]]
    }
  }
]
No markdown wrapping, just valid JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q, idx) => ({
            id: `ai-gen-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            text: q.text || 'Question statement',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
            topic: topic,
            difficulty: difficulty,
            explanation: q.explanation || 'Step-by-step placement explanation.',
            table: q.table && Array.isArray(q.table.headers) ? q.table : undefined,
          }));
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to curated generator:', err);
    }
  }

  // Curated fallback generator for offline / fallback scenarios
  return generateFallbackQuestions(topic, difficulty, safeCount);
}

function generateFallbackQuestions(
  topic: 'quantitative' | 'logical' | 'verbal' | 'data_interpretation',
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Question[] {
  const templates: Record<string, Question[]> = {
    quantitative: [
      {
        id: 'q-fb-1',
        text: 'A merchant marks up his goods by 25% above cost price and allows a discount of 10% on cash payment. Find his actual profit percentage.',
        options: ['12.5%', '15.0%', '10.0%', '14.2%'],
        correctAnswer: 0,
        topic: 'quantitative',
        difficulty,
        explanation: 'Let CP = 100. MP = 125. SP after 10% discount = 125 * 0.90 = 112.5. Profit = 112.5 - 100 = 12.5%.',
      },
      {
        id: 'q-fb-2',
        text: 'Two trains running in opposite directions on parallel tracks at 54 km/h and 36 km/h cross each other in 12 seconds. If one train is 160 m long, find the length of the other train.',
        options: ['140 m', '120 m', '150 m', '180 m'],
        correctAnswer: 0,
        topic: 'quantitative',
        difficulty,
        explanation: 'Relative speed = 54 + 36 = 90 km/h = 90 * (5/18) = 25 m/s. Total distance = 25 * 12 = 300 m. Length of second train = 300 - 160 = 140 m.',
      },
      {
        id: 'q-fb-3',
        text: 'A bag contains 4 red balls, 5 green balls, and 6 blue balls. If two balls are drawn at random without replacement, what is the probability that both are green?',
        options: ['2/21', '1/15', '4/35', '5/42'],
        correctAnswer: 0,
        topic: 'quantitative',
        difficulty,
        explanation: 'Total balls = 15. P(first green) = 5/15 = 1/3. P(second green) = 4/14 = 2/7. Total probability = 1/3 * 2/7 = 2/21.',
      },
    ],
    logical: [
      {
        id: 'q-fb-4',
        text: 'If in a code language, SYSTEM is coded as SYSMET and NEARER is coded as AENRER, then how will FRACTION be coded?',
        options: ['CARFNOIT', 'CARFTION', 'ARFCNOIT', 'CRAFNOIT'],
        correctAnswer: 0,
        topic: 'logical',
        difficulty,
        explanation: 'Divide the 8-letter word into two halves: FRAC and TION. Reverse the first 4 letters: CARF. Reverse the last 4 letters: NOIT. Combined: CARFNOIT.',
      },
      {
        id: 'q-fb-5',
        text: 'Statement: Should campus recruitment drives include mandatory coding tests for all engineering disciplines?\nArguments:\nI. Yes, digital literacy is a baseline requirement in IT-driven companies.\nII. No, core branches like Civil and Mechanical require non-computational competencies.',
        options: ['Only I is strong', 'Only II is strong', 'Both I and II are strong', 'Neither is strong'],
        correctAnswer: 2,
        topic: 'logical',
        difficulty,
        explanation: 'Both arguments present valid practical considerations for recruiters and specialized academic branches in industry.',
      },
    ],
    verbal: [
      {
        id: 'q-fb-6',
        text: 'Choose the most appropriate idiom/phrase to complete: "During the technical interview, Rahul was unable to explain the deadlock concept and completely ______."',
        options: ['drew a blank', 'hit the sack', 'spilled the beans', 'cut corners'],
        correctAnswer: 0,
        topic: 'verbal',
        difficulty,
        explanation: '"To draw a blank" means to fail to recall or come up with an answer.',
      },
      {
        id: 'q-fb-7',
        text: 'Find the correctly spelt word from the options:',
        options: ['Bureaucracy', 'Burocracy', 'Beuraucracy', 'Bureaucracity'],
        correctAnswer: 0,
        topic: 'verbal',
        difficulty,
        explanation: 'The correct spelling is Bureaucracy (B-U-R-E-A-U-C-R-A-C-Y).',
      },
    ],
    data_interpretation: [
      {
        id: 'q-fb-8',
        text: 'Analyze the quarterly hiring report table. Which quarter saw the highest percentage increase in campus hires compared to the previous quarter?',
        options: ['Q2', 'Q3', 'Q4', 'All equal'],
        correctAnswer: 1,
        topic: 'data_interpretation',
        difficulty,
        table: {
          headers: ['Quarter', 'Campus Hires', 'Lateral Hires'],
          rows: [
            ['Q1', '200', '150'],
            ['Q2', '240', '180'],
            ['Q3', '360', '210'],
            ['Q4', '400', '250'],
          ],
        },
        explanation: 'Q2 increase: (240 - 200)/200 = 20%. Q3 increase: (360 - 240)/240 = 50%. Q4 increase: (400 - 360)/360 = 11.1%. Q3 was highest at 50%.',
      },
    ],
  };

  const list = templates[topic] || templates.quantitative;
  const results: Question[] = [];
  for (let i = 0; i < count; i++) {
    const item = list[i % list.length];
    results.push({
      ...item,
      id: `fallback-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      difficulty,
    });
  }
  return results;
}
