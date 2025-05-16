'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlayerList from '@/components/PlayerList';
import WordSuggestion from '@/components/WordSuggestion';
import type { Player, Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Copy, Play, Share2, Users, ChevronLeft, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Mock a function to get room details, in a real app this would be an API/socket call
const fetchRoomDetails = async (roomCode: string, nickname: string): Promise<Room | null> => {
  console.log(`Fetching room ${roomCode} for ${nickname}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For now, create a mock room or retrieve from local storage if it exists
  let mockRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
  
  if (mockRooms[roomCode]) {
    const room = mockRooms[roomCode];
    const playerExists = room.players.find((p: Player) => p.nickname === nickname);
    if (!playerExists) {
      room.players.push({ id: Math.random().toString(36).substring(7), nickname, score: 0 });
    }
     mockRooms[roomCode] = room;
  } else {
     mockRooms[roomCode] = {
      roomCode,
      players: [{ id: Math.random().toString(36).substring(7), nickname, score: 0, isHost: true }],
      hostId: nickname, // Simple host tracking by nickname for mock
      isGameActive: false,
      messages: [],
      maxRounds: 3, // Default maxRounds
    };
  }
  localStorage.setItem('scribbleRooms', JSON.stringify(mockRooms));
  return mockRooms[roomCode];
};


export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomCode = params.roomCode as string;
  const nickname = searchParams.get('nickname') || 'Player';

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNickname, setCurrentNickname] = useState<string>(nickname);
  const [maxRounds, setMaxRounds] = useState(3);

  const isHost = room?.hostId === currentNickname; // Simplified host check

  const loadRoom = useCallback(async () => {
    setIsLoading(true);
    if (!roomCode) return;
    try {
      const roomData = await fetchRoomDetails(roomCode, currentNickname);
      if (roomData) {
        setRoom(roomData);
        setMaxRounds(roomData.maxRounds || 3);
      } else {
        toast({ title: 'Error', description: 'Room not found or could not be joined.', variant: 'destructive' });
        router.push('/');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load room details.', variant: 'destructive' });
      console.error(error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, currentNickname, router, toast]);

  useEffect(() => {
    setCurrentNickname(nickname); // Ensure nickname from URL is used
  }, [nickname]);

  useEffect(() => {
    loadRoom();
    
    // Simulate player joining/leaving via polling or mock updates
    const intervalId = setInterval(() => {
        const updatedRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
        if(updatedRooms[roomCode]) {
            setRoom(updatedRooms[roomCode]);
        }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);

  }, [loadRoom, roomCode]);


  const handleStartGame = () => {
    if (!room || !isHost) return;
    // In a real app, this would emit a socket event
    // For now, update mock room state and navigate
    const updatedRoom = { ...room, isGameActive: true, currentWord: "APPLE", currentDrawerId: room.players[0].id, maxRounds: maxRounds };
    let mockRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
    mockRooms[roomCode] = updatedRoom;
    localStorage.setItem('scribbleRooms', JSON.stringify(mockRooms));
    
    setRoom(updatedRoom); // Update local state to reflect change
    toast({ title: 'Game Starting!', description: `The game in room ${roomCode} is about to begin.` });
    router.push(`/game/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my Scribble Stadium game!',
        text: `Join my game in Scribble Stadium with room code: ${roomCode}`,
        url: window.location.href,
      })
      .then(() => toast({ title: 'Shared!', description: 'Invitation sent.'}))
      .catch((error) => console.log('Error sharing', error));
    } else {
      handleCopyRoomCode(); // Fallback for browsers that don't support Web Share API
      toast({ title: 'Link Copied', description: 'Share this link with your friends: ' + window.location.href });
    }
  };

  const handleWordSuggested = (word: string) => {
    // Optionally, do something with the suggested word, e.g., pre-fill for host
    console.log("Word suggested in lobby:", word);
  };
  
  const handleSettingsUpdate = () => {
    if (!room || !isHost) return;
    const updatedRoom = { ...room, maxRounds };
    let mockRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
    mockRooms[roomCode] = updatedRoom;
    localStorage.setItem('scribbleRooms', JSON.stringify(mockRooms));
    setRoom(updatedRoom);
    toast({ title: 'Settings Updated', description: `Max rounds set to ${maxRounds}.`});
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Copy className="w-8 h-8 animate-spin text-primary" /> <span className="ml-2 text-xl">Loading Lobby...</span></div>;
  }

  if (!room) {
    return <div className="text-center text-xl text-destructive">Room not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-4xl font-bold text-primary">Room: {roomCode}</CardTitle>
              <CardDescription className="text-lg">Waiting for players... The host will start the game.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleCopyRoomCode} title="Copy Room Code">
                <Copy className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} title="Share Room">
                <Share2 className="w-6 h-6" />
              </Button>
              {isHost && (
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Game Settings">
                        <Settings className="w-6 h-6" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Game Settings</DialogTitle>
                        <DialogDescription>Adjust game parameters for this room.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="maxRounds" className="text-right col-span-1">
                            Max Rounds
                          </Label>
                          <Input
                            id="maxRounds"
                            type="number"
                            value={maxRounds}
                            onChange={(e) => setMaxRounds(Math.max(1, parseInt(e.target.value,10) || 1))}
                            className="col-span-3"
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSettingsUpdate}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <PlayerList players={room.players || []} hostId={room.hostId} />
          </div>
          <div className="space-y-4">
            {isHost && (
              <Button onClick={handleStartGame} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                <Play className="mr-2 h-6 w-6" /> Start Game
              </Button>
            )}
            {!isHost && (
                <div className="text-center p-4 bg-secondary rounded-md">
                    <p className="text-muted-foreground font-semibold">Waiting for the host ({room.hostId || 'Host'}) to start the game.</p>
                </div>
            )}
            <WordSuggestion onWordSuggested={handleWordSuggested} />
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4"/> {room.players.length} player(s) currently in the lobby. Max rounds: {room.maxRounds || 3}.
        </CardFooter>
      </Card>
    </div>
  );
}
