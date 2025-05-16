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

You will suggest a single word to draw based on the topic, or a random object if no topic is provided.

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
    const {output} = await prompt(input);
    return output!;
  }
);
