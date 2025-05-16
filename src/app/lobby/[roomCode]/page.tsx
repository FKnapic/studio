
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlayerList from '@/components/PlayerList';
import type { Player, Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Copy, Play, Share2, Users, ChevronLeft, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// This function would typically not exist in a WebSocket setup.
// The server would send room details after a successful join/create.
const initializeRoomData = (roomCode: string, nickname: string, isCreating: boolean): Room | null => {
  console.log(`[LobbyPage/initializeRoomData] Room: ${roomCode}, Nickname: ${nickname}, IsCreating: ${isCreating}`);
  if (isCreating) {
    const newPlayerId = Math.random().toString(36).substring(7);
    const newHostPlayer: Player = { id: newPlayerId, nickname, score: 0, isHost: true };
    return {
      roomCode,
      players: [newHostPlayer],
      hostId: newPlayerId,
      isGameActive: false,
      messages: [],
      maxRounds: 3,
    };
  }
  // If joining, we expect the server to send data. For now, return a basic structure.
  // A real app would show a loading state until server confirms and sends data.
  return {
    roomCode,
    players: [{id: Math.random().toString(36).substring(7), nickname, score: 0, isHost: false }], // Placeholder for current player
    hostId: 'unknown_host', // Server would provide this
    isGameActive: false,
    messages: [],
    maxRounds: 3,
  };
};


export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomCode = params.roomCode as string;
  const nicknameFromParams = searchParams.get('nickname') || 'Player';
  const isCreationAttempt = searchParams.get('action') === 'create';

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNickname, setCurrentNickname] = useState<string>(nicknameFromParams);
  const [maxRounds, setMaxRounds] = useState(3); // Default, server would confirm

  const currentPlayerInLobby = room?.players.find(p => p.nickname === currentNickname);
  // isHost determination would come from server data (e.g. player object having an isHost flag or comparing player ID with room.hostId)
  const isHost = !!currentPlayerInLobby && currentPlayerInLobby.id === room?.hostId;

  useEffect(() => {
    setCurrentNickname(nicknameFromParams);
  }, [nicknameFromParams]);

  useEffect(() => {
    setIsLoading(true);
    if (!roomCode || !currentNickname) {
        toast({ title: "Error", description: "Missing room or player information.", variant: "destructive"});
        router.push('/');
        return;
    }

    // In a WebSocket setup:
    // 1. Establish socket connection if not already connected.
    // 2. If isCreationAttempt, this might have been handled by an earlier 'createRoom' emit from home page.
    //    If directly landing here as creator, might need to emit 'createRoom' or 'rejoinAsHost'.
    // 3. If joining, emit 'joinRoomLobby' with roomCode and nickname.
    //    socket.emit('joinRoomLobby', { roomCode, nickname: currentNickname });
    // 4. Server responds with 'roomDetails' or 'roomNotFound' / 'joinError'.

    // For now, initialize with basic data or simulate loading.
    const initialData = initializeRoomData(roomCode, currentNickname, isCreationAttempt);
    if (initialData) {
      setRoom(initialData);
      setMaxRounds(initialData.maxRounds || 3);
    } else {
      // This path implies initializeRoomData decided the room shouldn't exist client-side (e.g. !isCreationAttempt and no server data yet)
      toast({ title: 'Joining Room...', description: `Attempting to join room ${roomCode}.`});
      // A real app might show a loading spinner here until server responds.
      // If server says room doesn't exist, then redirect.
    }
    setIsLoading(false); // Simulate loading complete for now

    // Set up socket event listeners
    // Example:
    // socket.on('roomUpdated', (updatedRoomData: Room) => {
    //   setRoom(updatedRoomData);
    //   setMaxRounds(updatedRoomData.maxRounds || 3);
    //   setIsLoading(false);
    // });
    // socket.on('playerJoined', (newPlayer: Player) => {
    //   setRoom(prevRoom => prevRoom ? { ...prevRoom, players: [...prevRoom.players, newPlayer] } : null);
    // });
    // socket.on('playerLeft', (playerId: string) => {
    //   setRoom(prevRoom => prevRoom ? { ...prevRoom, players: prevRoom.players.filter(p => p.id !== playerId) } : null);
    // });
    // socket.on('gameStartedByHost', (gameRoomData: Room) => {
    //   setRoom(gameRoomData); // Update local room state
    //   toast({ title: 'Game Starting!', description: 'Joining the game...' });
    //   router.push(`/game/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
    // });
    // socket.on('roomNotFound', () => {
    //    toast({ title: 'Room Not Found', description: `The room "${roomCode}" doesn't exist.`, variant: 'destructive' });
    //    router.push('/');
    //    setIsLoading(false);
    // });
    // socket.on('settingsUpdated', (newMaxRounds: number) => {
    //    setMaxRounds(newMaxRounds);
    //    if(room) setRoom({...room, maxRounds: newMaxRounds});
    //    toast({ title: 'Settings Updated', description: `Max rounds set to ${newMaxRounds}.`});
    // });


    // Cleanup listeners on component unmount
    // return () => {
    //   socket.off('roomUpdated');
    //   socket.off('playerJoined');
    //   // ... and other listeners
    // };
  }, [roomCode, currentNickname, router, toast, isCreationAttempt]);


  // This effect handles navigation for non-hosts when the game starts.
  // It relies on the 'room' state being updated by a (simulated) socket event.
  useEffect(() => {
    if (room?.isGameActive && !isHost && !isLoading) {
      console.log(`[LobbyPage/GameStartEffect] Non-host ${currentNickname} detected game start for room ${roomCode}. Navigating.`);
      router.push(`/game/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
    }
  }, [room?.isGameActive, isHost, isLoading, roomCode, currentNickname, router, toast]);


  const handleStartGame = () => {
    if (!room || !isHost || !currentPlayerInLobby) return;
    console.log(`[LobbyPage/handleStartGame] Host ${currentNickname} attempting to start game for room ${roomCode}.`);
    
    // In a WebSocket setup:
    // socket.emit('startGame', { roomCode, maxRounds });
    // Server would then validate, set game to active, choose first drawer, and broadcast 'gameStartedByHost' to all in room.
    // The host would also navigate upon receiving 'gameStartedByHost'.

    // For now, simulate the host's action and navigation.
    // Other players' navigation is handled by the useEffect above, triggered by room.isGameActive change.
    const updatedRoomForHost: Room = {
        ...room,
        isGameActive: true,
        currentDrawerId: room.players.length > 0 ? room.players[0].id : undefined,
        maxRounds: maxRounds,
        round: 0, // Game starts at round 0 or 1, server decides
        messages: [{id: Date.now().toString(), nickname:"System", text: "Game started by host!", timestamp: Date.now(), isSystemMessage: true }]
    };
    setRoom(updatedRoomForHost); // Host updates their own state
    toast({ title: 'Game Starting!', description: `The game in room ${roomCode} is about to begin.` });
    router.push(`/game/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
  };

  const handleCopyRoomCode = () => {
    if(roomCode){
        navigator.clipboard.writeText(roomCode);
        toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
    }
  };

  const handleShare = () => {
    const joinUrl = window.location.origin + `/lobby/${roomCode}`; // Simplified share URL
    if (navigator.share) {
      navigator.share({
        title: 'Join my Scribble Stadium game!',
        text: `Join my game in Scribble Stadium! Room Code: ${roomCode}`,
        url: joinUrl,
      })
      .then(() => toast({ title: 'Shared!', description: 'Invitation link shared.'}))
      .catch((error) => {
        console.log('[LobbyPage/handleShare] Error sharing:', error);
        navigator.clipboard.writeText(`Join my Scribble Stadium game! Room Code: ${roomCode}. Link: ${joinUrl}`);
        toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
      });
    } else {
      navigator.clipboard.writeText(`Join my Scribble Stadium game! Room Code: ${roomCode}. Link: ${joinUrl}`);
      toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
    }
  };
  
  const handleSettingsUpdate = () => {
    if (!room || !isHost) return;
    console.log(`[LobbyPage/handleSettingsUpdate] Host updating maxRounds to ${maxRounds} for room ${roomCode}.`);
    // In a WebSocket setup:
    // socket.emit('updateSettings', { roomCode, maxRounds });
    // Server would validate and broadcast 'settingsUpdated' or 'roomUpdated'.
    
    // For now, host updates local state. Other clients would get this via 'settingsUpdated' or 'roomUpdated' socket event.
    setRoom(prev => prev ? {...prev, maxRounds} : null);
    toast({ title: 'Settings Updated', description: `Max rounds set to ${maxRounds}. (This would be confirmed by server)`});
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /> <span className="ml-2 text-xl">Loading Lobby...</span></div>;
  }

  if (!room) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Room Error</h2>
            <p className="text-muted-foreground mb-4">Could not load room details. The room might not exist or an error occurred.</p>
            <Button onClick={() => router.push('/')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Go to Homepage
            </Button>
        </div>
    );
  }
  
  const hostPlayer = room.players.find(p => p.id === room.hostId);

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
              <CardDescription className="text-lg">Waiting for players... The host ({hostPlayer?.nickname || 'Unknown'}) will start the game.</CardDescription>
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
                            max="10" // Arbitrary max, server should validate
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => { handleSettingsUpdate(); const closeButton = document.querySelector('.dialog-close-button'); if (closeButton instanceof HTMLElement) closeButton.click();}}>Save Changes</Button>
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
              <Button onClick={handleStartGame} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg" disabled={room.players.length < 1 /* Server might enforce min players */}>
                <Play className="mr-2 h-6 w-6" /> Start Game
              </Button>
            )}
            {!isHost && (
                <div className="text-center p-4 bg-secondary rounded-md">
                    <p className="text-muted-foreground font-semibold">Waiting for the host ({hostPlayer?.nickname || 'Host'}) to start the game.</p>
                </div>
            )}
             <div className="h-10"></div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4"/> {room.players.length} player(s) currently in the lobby. Max rounds: {room.maxRounds || 3}.
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper to close dialog after save in settings: Add a DialogClose button with a specific class if not already present in ShadCN component.
// <DialogClose className="dialog-close-button hidden" />
// This is a bit of a hack, better to use controlled dialog state if needed.
