
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// IMPORTANT: Ensure you have a GOOGLE_API_KEY (or GOOGLE_GEMINI_API_KEY)
// environment variable set in your .env file or deployment environment.
// Example .env file content:
// GOOGLE_API_KEY=your_actual_api_key_here

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

