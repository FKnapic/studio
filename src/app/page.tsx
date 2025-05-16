
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PenTool, Users, LogIn } from 'lucide-react';
// Room type is no longer directly managed or checked here from localStorage
// import type { Room } from '@/types';

export default function HomePage() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Nickname can still be stored locally for convenience, not for game state.
    const storedNickname = localStorage.getItem('scribbleNickname');
    if (storedNickname) {
      setNickname(storedNickname);
    }
  }, []);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value;
    setNickname(newNickname);
    localStorage.setItem('scribbleNickname', newNickname);
  };

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      toast({ title: 'Nickname required', description: 'Please enter a nickname to create a room.', variant: 'destructive' });
      return;
    }
    const newRoomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    console.log(`[HomePage] Creating room with code: ${newRoomCode} for nickname: ${nickname.trim()}`);
    
    // In a WebSocket setup:
    // 1. Emit a "createRoom" event to the server with nickname and newRoomCode.
    // socket.emit('createRoom', { nickname: nickname.trim(), roomCode: newRoomCode });
    // 2. Server creates the room, adds the player, and responds (e.g., 'roomCreated' event).
    // 3. On 'roomCreated' success, navigate.
    
    // For now, we navigate directly, assuming the server handles creation.
    // The 'action=create' param can hint to the lobby that the user initiated creation.
    router.push(`/lobby/${newRoomCode}?nickname=${encodeURIComponent(nickname.trim())}&action=create`);
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      toast({ title: 'Nickname required', description: 'Please enter a nickname to join a room.', variant: 'destructive' });
      return;
    }
    if (!roomCode.trim()) {
      toast({ title: 'Room code required', description: 'Please enter a room code.', variant: 'destructive' });
      return;
    }
    
    const targetRoomCode = roomCode.trim().toUpperCase();
    console.log(`[HomePage] Attempting to join room. Nickname: "${nickname.trim()}", Room Code Input: "${roomCode}", Target Code: "${targetRoomCode}"`);

    // In a WebSocket setup:
    // 1. Emit a "joinRoom" event to the server with nickname and targetRoomCode.
    // socket.emit('joinRoom', { nickname: nickname.trim(), roomCode: targetRoomCode });
    // 2. Server checks if room exists, if player can join, and responds (e.g., 'joinSuccess' or 'joinError').
    // 3. On 'joinSuccess', navigate. On 'joinError', show toast.

    // For now, we navigate directly. The lobby page would then try to fetch room details via sockets.
    // If the server can't find the room or doesn't allow join, it would handle it (e.g., redirect back or show error).
    router.push(`/lobby/${targetRoomCode}?nickname=${encodeURIComponent(nickname.trim())}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <PenTool className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Scribble Stadium!</CardTitle>
          <CardDescription>Draw, guess, and have fun with friends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-lg">Enter Your Nickname</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="CoolArtist123"
              value={nickname}
              onChange={handleNicknameChange}
              className="text-base py-3 px-4"
            />
          </div>
          <div className="space-y-4">
            <Button onClick={handleCreateRoom} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
              <Users className="mr-2 h-5 w-5" /> Create New Room
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomCode" className="text-lg">Join Existing Room</Label>
              <Input
                id="roomCode"
                type="text"
                placeholder="Enter Room Code (e.g., ABC12)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="text-base py-3 px-4"
              />
            </div>
            <Button onClick={handleJoinRoom} variant="secondary" className="w-full text-lg py-6">
              <LogIn className="mr-2 h-5 w-5" /> Join Room
            </Button>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                Tip: Share the room code with your friends to let them join!
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
