
'use server';

/**
 * @fileOverview An AI agent that suggests a word to draw.
 *
 * - suggestWord - A function that suggests a word to draw.
 * - SuggestWordInput - The input type for the suggestWord function.
 * - SuggestWordOutput - The return type for the suggestWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWordInputSchema = z.object({
  topic: z.string().optional().describe('The topic of the word to suggest.'),
});
export type SuggestWordInput = z.infer<typeof SuggestWordInputSchema>;

const SuggestWordOutputSchema = z.object({
  word: z.string().describe('The suggested word to draw.'),
});
export type SuggestWordOutput = z.infer<typeof SuggestWordOutputSchema>;

export async function suggestWord(input: SuggestWordInput): Promise<SuggestWordOutput> {
  return suggestWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWordPrompt',
  input: {schema: SuggestWordInputSchema},
  output: {schema: SuggestWordOutputSchema},
  prompt: `You are a creative word suggestion AI.

You will suggest a single, common, and drawable word based on the topic, or a random common, drawable object if no topic is provided. The word should be suitable for a drawing game. Avoid overly complex or abstract words.

Topic: {{{topic}}}
`,
});

const suggestWordFlow = ai.defineFlow(
  {
    name: 'suggestWordFlow',
    inputSchema: SuggestWordInputSchema,
    outputSchema: SuggestWordOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;

    if (!output || typeof output.word !== 'string' || output.word.trim() === '') {
      console.error('AI response missing expected "word" or word is empty. Full response:', JSON.stringify(response, null, 2));
      
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
         throw new Error(`AI generation failed. Reason: ${finishReason}. This could be due to safety filters, API key issues, or query limits. Try a different topic or check your API key/quota.`);
      }
      throw new Error('AI could not suggest a valid word. The model may have returned an empty or malformed response. Please try again or use a different topic.');
    }
    return output;
  }
);

