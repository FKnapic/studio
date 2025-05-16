
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlayerList from '@/components/PlayerList';
import type { Player, Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Copy, Play, Share2, Users, ChevronLeft, Settings, AlertTriangle } from 'lucide-react';
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
const fetchRoomDetails = async (roomCode: string, nickname: string, isCreating: boolean): Promise<Room | null> => {
  console.log(`Fetching room ${roomCode} for ${nickname}. Is creating: ${isCreating}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let mockRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
  
  if (mockRooms[roomCode]) { // Room exists
    const room = mockRooms[roomCode];
    const playerExists = room.players.find((p: Player) => p.nickname === nickname);
    if (!playerExists) {
      room.players.push({ id: Math.random().toString(36).substring(7), nickname, score: 0 });
    }
     mockRooms[roomCode] = room;
     localStorage.setItem('scribbleRooms', JSON.stringify(mockRooms));
     return room;
  } else if (isCreating) { // Room does not exist, but we are in "create" mode (i.e., host is joining for the first time)
     const newRoom = {
      roomCode,
      players: [{ id: Math.random().toString(36).substring(7), nickname, score: 0, isHost: true }],
      hostId: nickname, 
      isGameActive: false,
      messages: [],
      maxRounds: 3,
    };
    mockRooms[roomCode] = newRoom;
    localStorage.setItem('scribbleRooms', JSON.stringify(mockRooms));
    return newRoom;
  }
  // Room does not exist and we are not in "create" mode (i.e., trying to join a non-existent room)
  return null; 
};


export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomCode = params.roomCode as string;
  const nickname = searchParams.get('nickname') || 'Player';
  // Determine if this navigation to lobby is part of a "create room" flow.
  // A simple heuristic: if the player joining is the first player or matches a potential host flag.
  // For robust solution, this might be passed as a query param e.g. ?action=create
  const isHostJoiningInitially = () => {
    const rooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
    // If room doesn't exist yet, this is effectively a create/initial join by host.
    // Or, if it exists but player list is empty (less likely with current logic but good check)
    return !rooms[roomCode] || rooms[roomCode]?.players.length === 0;
  };


  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNickname, setCurrentNickname] = useState<string>(nickname);
  const [maxRounds, setMaxRounds] = useState(3);

  const isHost = room?.hostId === currentNickname;

  const loadRoom = useCallback(async () => {
    setIsLoading(true);
    if (!roomCode || !currentNickname) {
        toast({ title: "Error", description: "Missing room or player information.", variant: "destructive"});
        router.push('/');
        return;
    }
    try {
      // When loading the lobby, we differentiate if it's an attempt to create (first host join) or join an existing one.
      // For this mock, we assume if the nickname is trying to access a room for the first time, they are the host creating it.
      // A more robust way would be to pass a query parameter from the create room button.
      // Let's refine `isHostJoiningInitially` or pass a query param.
      // For now, we'll assume if `fetchRoomDetails` is called for a non-existent room,
      // it's a creation event if the hostId matches nickname, otherwise it's a join attempt.
      // Simplified: the 'isCreating' flag in fetchRoomDetails will handle this.
      // If localStorage has no room `roomCode` yet, it's effectively a creation by the first player.
      const rooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
      const isCreationAttempt = !rooms[roomCode] && searchParams.get('action') === 'create';


      const roomData = await fetchRoomDetails(roomCode, currentNickname, isCreationAttempt);
      if (roomData) {
        setRoom(roomData);
        setMaxRounds(roomData.maxRounds || 3);
      } else {
        toast({ title: 'Room Not Found', description: `The room "${roomCode}" doesn't exist or you couldn't join.`, variant: 'destructive' });
        router.push('/');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load room details.', variant: 'destructive' });
      console.error(error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, currentNickname, router, toast, searchParams]);

  useEffect(() => {
    setCurrentNickname(nickname); 
  }, [nickname]);

  useEffect(() => {
    loadRoom();
    
    const intervalId = setInterval(() => {
        const updatedRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
        if(updatedRooms[roomCode]) {
            setRoom(prevRoom => {
              // Only update if there are actual changes to avoid unnecessary re-renders
              if (JSON.stringify(prevRoom) !== JSON.stringify(updatedRooms[roomCode])) {
                return updatedRooms[roomCode];
              }
              return prevRoom;
            });
        } else if (room) { // Room existed but now is gone from storage
            toast({ title: "Room Closed", description: "The room seems to have been closed or no longer exists.", variant: "destructive" });
            router.push('/');
        }
    }, 3000); 

    return () => clearInterval(intervalId);

  }, [loadRoom, roomCode, router, toast, room]);


  const handleStartGame = () => {
    if (!room || !isHost) return;
    const updatedRoom = { ...room, isGameActive: true, currentWord: "APPLE", currentDrawerId: room.players[0].id, maxRounds: maxRounds }; // TODO: Pick random first word & drawer
    let mockRooms = JSON.parse(localStorage.getItem('scribbleRooms') || '{}');
    mockRooms[roomCode] = updatedRoom;
    localStorage.setItem('scribbleRooms', JSON.stringify(mockRooms));
    
    setRoom(updatedRoom); 
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
        url: window.location.href.split('?')[0], // Share URL without query params for joining
      })
      .then(() => toast({ title: 'Shared!', description: 'Invitation sent.'}))
      .catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(`${window.location.href.split('?')[0]}?nickname=<YourNickname>`);
      toast({ title: 'Link Copied', description: 'Share this link with your friends: ' + window.location.href.split('?')[0] + ". They'll need to add their nickname." });
    }
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
    // This state should ideally be brief as loadRoom redirects if room is null after load.
    // However, it can be shown if loadRoom is still in progress or somehow failed to redirect.
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Room Error</h2>
            <p className="text-muted-foreground mb-4">Could not load room details. It might not exist or an error occurred.</p>
            <Button onClick={() => router.push('/')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Go to Homepage
            </Button>
        </div>
    );
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
          <div className="space-y-4 flex flex-col justify-between">
            {isHost && (
              <Button onClick={handleStartGame} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg" disabled={room.players.length < 1 /* Consider min 2 players to start a game */}>
                <Play className="mr-2 h-6 w-6" /> Start Game
              </Button>
            )}
            {!isHost && (
                <div className="text-center p-4 bg-secondary rounded-md">
                    <p className="text-muted-foreground font-semibold">Waiting for the host ({room.hostId || 'Host'}) to start the game.</p>
                </div>
            )}
            {/* Removed WordSuggestion component */}
             <div className="h-10"></div> {/* Placeholder to maintain layout if needed or remove */}
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4"/> {room.players.length} player(s) currently in the lobby. Max rounds: {room.maxRounds || 3}.
        </CardFooter>
      </Card>
    </div>
  );
}

