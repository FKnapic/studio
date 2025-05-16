'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb } from 'lucide-react';
import { suggestWord, type SuggestWordInput } from '@/ai/flows/suggest-word'; // Ensure this path is correct
import { useToast } from '@/hooks/use-toast';

interface WordSuggestionProps {
  onWordSuggested?: (word: string) => void;
}

export default function WordSuggestion({ onWordSuggested }: WordSuggestionProps) {
  const [topic, setTopic] = useState('');
  const [suggestedWord, setSuggestedWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggestWord = async () => {
    setIsLoading(true);
    setSuggestedWord('');
    try {
      const input: SuggestWordInput = { topic: topic.trim() || undefined };
      const result = await suggestWord(input);
      if (result && result.word) {
        setSuggestedWord(result.word);
        toast({
          title: 'Word Suggested!',
          description: `AI suggested: ${result.word}`,
        });
        if (onWordSuggested) {
          onWordSuggested(result.word);
        }
      } else {
        toast({
          title: 'Suggestion Failed',
          description: 'Could not get a word suggestion at this time.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error suggesting word:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while suggesting a word.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          AI Word Suggester
        </CardTitle>
        <CardDescription>Get a creative word suggestion from our AI!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="topic">Optional Topic</Label>
          <Input
            id="topic"
            type="text"
            placeholder="e.g., Animals, Food, Fantasy"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleSuggestWord} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Suggest a Word
        </Button>
        {suggestedWord && !isLoading && (
          <p className="text-center text-lg font-semibold text-primary pt-2">
            Suggested: <span className="text-accent">{suggestedWord}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
