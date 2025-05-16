'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentNickname: string;
  disabled?: boolean;
}

export default function ChatBox({ messages, onSendMessage, currentNickname, disabled = false }: ChatBoxProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Chat & Guesses
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[calc(100%-0px)] p-4" ref={scrollAreaRef}> {/* Adjust height as needed */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col p-2 rounded-lg max-w-[85%] 
                  ${msg.nickname === currentNickname ? 'bg-primary/80 text-primary-foreground self-end items-end' : 'bg-secondary self-start items-start'}
                  ${msg.isSystemMessage ? 'bg-muted text-muted-foreground self-center text-center italic w-full max-w-full text-sm' : ''}
                  ${msg.isCorrectGuess ? '!bg-accent !text-accent-foreground font-semibold' : ''}
                `}
              >
                {!msg.isSystemMessage && (
                  <span className={`text-xs font-semibold mb-0.5 ${msg.nickname === currentNickname ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {msg.nickname}
                  </span>
                )}
                <p className="text-base whitespace-pre-wrap break-words">{msg.text}</p>
                <span className={`text-xs mt-1 ${msg.nickname === currentNickname ? 'text-primary-foreground/70' : 'text-muted-foreground/80'} ${msg.isSystemMessage ? 'text-muted-foreground/80' : ''}`}>
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))}
             {messages.length === 0 && (
              <p className="text-muted-foreground text-center">No messages yet. Start chatting or make a guess!</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder={disabled ? "Chat disabled" : "Type your guess or message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow"
            disabled={disabled}
          />
          <Button type="submit" size="icon" disabled={disabled || !newMessage.trim()} aria-label="Send Message">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
