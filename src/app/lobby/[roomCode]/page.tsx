
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
  console.log(`[LobbyPage/fetchRoomDetails] Fetching room ${roomCode} for ${nickname}. Is creating: ${isCreating}`);

  let mockRoomsStorage: Record<string, Room> = {};
  try {
    const storedRooms = localStorage.getItem('scribbleRooms');
    if (storedRooms) {
      mockRoomsStorage = JSON.parse(storedRooms);
      console.log("[LobbyPage/fetchRoomDetails] Initial 'scribbleRooms' from localStorage:", JSON.parse(JSON.stringify(mockRoomsStorage)));
    } else {
      console.log("[LobbyPage/fetchRoomDetails] 'scribbleRooms' not found in localStorage or is null.");
    }
  } catch (e) {
    console.error("[LobbyPage/fetchRoomDetails] Failed to parse 'scribbleRooms' from localStorage on init:", e);
    // mockRoomsStorage remains {}
  }
  
  if (mockRoomsStorage[roomCode] && !isCreating) { // Room exists and we are not trying to create it again (e.g. joining)
    const room = mockRoomsStorage[roomCode];
    console.log(`[LobbyPage/fetchRoomDetails] Joining existing room: ${roomCode}. Current players:`, room.players);
    const playerExists = room.players.find((p: Player) => p.nickname === nickname);
    if (!playerExists) {
      room.players.push({ id: Math.random().toString(36).substring(7), nickname, score: 0, isHost: false });
      console.log(`[LobbyPage/fetchRoomDetails] Player ${nickname} added to room ${roomCode}.`);
    }
     mockRoomsStorage[roomCode] = room;
     try {
       localStorage.setItem('scribbleRooms', JSON.stringify(mockRoomsStorage));
       console.log(`[LobbyPage/fetchRoomDetails] Updated room ${roomCode} (player joined) saved to localStorage.`);
     } catch (e) {
       console.error("[LobbyPage/fetchRoomDetails] Failed to set scribbleRooms in localStorage (joining existing room):", e);
     }
     return room;
  } else if (isCreating) { // Room does not exist OR we are explicitly creating (overwriting if joining with create flag)
     console.log(`[LobbyPage/fetchRoomDetails] Creating new room: ${roomCode} for host: ${nickname}`);
     const newPlayerId = Math.random().toString(36).substring(7);
     const newHostPlayer: Player = { id: newPlayerId, nickname, score: 0, isHost: true };
     const newRoom: Room = {
      roomCode,
      players: [newHostPlayer],
      hostId: newPlayerId, 
      isGameActive: false,
      messages: [],
      maxRounds: 3,
    };
    mockRoomsStorage[roomCode] = newRoom;
    try {
      localStorage.setItem('scribbleRooms', JSON.stringify(mockRoomsStorage));
      console.log(`[LobbyPage/fetchRoomDetails] Room "${roomCode}" created and saved to localStorage. All rooms:`, JSON.parse(JSON.stringify(mockRoomsStorage)));
    } catch (e) {
      console.error(`[LobbyPage/fetchRoomDetails] CRITICAL: Failed to set scribbleRooms in localStorage when creating room "${roomCode}":`, e);
    }
    return newRoom;
  }
  console.warn(`[LobbyPage/fetchRoomDetails] Room ${roomCode} not found and not creating. Returning null.`);
  return null; 
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
  const [maxRounds, setMaxRounds] = useState(3);

  const currentPlayerInLobby = room?.players.find(p => p.nickname === currentNickname);
  const isHost = !!currentPlayerInLobby && currentPlayerInLobby.id === room?.hostId && !!currentPlayerInLobby.isHost;


  const loadRoom = useCallback(async () => {
    setIsLoading(true);
    if (!roomCode || !currentNickname) {
        toast({ title: "Error", description: "Missing room or player information.", variant: "destructive"});
        router.push('/');
        return;
    }
    try {
      console.log(`[LobbyPage/loadRoom] Calling fetchRoomDetails. RoomCode: ${roomCode}, Nickname: ${currentNickname}, isCreationAttempt: ${isCreationAttempt}`);
      const roomData = await fetchRoomDetails(roomCode, currentNickname, isCreationAttempt);
      if (roomData) {
        console.log(`[LobbyPage/loadRoom] Room data successfully fetched/created:`, roomData);
        setRoom(roomData);
        setMaxRounds(roomData.maxRounds || 3);
      } else {
        console.warn(`[LobbyPage/loadRoom] fetchRoomDetails returned null for room ${roomCode}. Redirecting.`);
        toast({ title: 'Room Not Found', description: `The room "${roomCode}" doesn't exist or you couldn't join.`, variant: 'destructive' });
        router.push('/');
      }
    } catch (error) {
      console.error('[LobbyPage/loadRoom] Error loading room details:', error);
      toast({ title: 'Error', description: 'Failed to load room details.', variant: 'destructive' });
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, currentNickname, router, toast, isCreationAttempt]);

  useEffect(() => {
    setCurrentNickname(nicknameFromParams); 
  }, [nicknameFromParams]);

  useEffect(() => {
    loadRoom();
    
    const intervalId = setInterval(() => {
        let updatedRoomsStorage: Record<string, Room> = {};
        try {
          const storedRooms = localStorage.getItem('scribbleRooms');
          if (storedRooms) updatedRoomsStorage = JSON.parse(storedRooms);
        } catch(e) {
          console.error("[LobbyPage/PollingInterval] Failed to parse scribbleRooms from localStorage:", e);
          return; 
        }

        const currentRoomDataFromStorage = updatedRoomsStorage[roomCode];

        setRoom(prevRoom => {
            if (currentRoomDataFromStorage) {
                if (JSON.stringify(prevRoom) !== JSON.stringify(currentRoomDataFromStorage)) {
                    console.log("[LobbyPage/PollingInterval] Detected change in room data from localStorage. Updating local state.", currentRoomDataFromStorage);
                    return currentRoomDataFromStorage;
                }
                return prevRoom;
            } else { 
                if (prevRoom) { 
                    console.warn(`[LobbyPage/PollingInterval] Room ${roomCode} disappeared from localStorage. Closing lobby.`);
                    toast({ title: "Room Closed", description: "The room seems to have been closed or no longer exists.", variant: "destructive" });
                    router.push('/');
                    clearInterval(intervalId); 
                }
                return null; 
            }
        });
    }, 3000); 

    return () => clearInterval(intervalId);

  }, [loadRoom, roomCode, router, toast]); 

  useEffect(() => {
    if (room?.isGameActive && !isHost && !isLoading) { 
      console.log(`[LobbyPage/GameStartEffect] Non-host ${currentNickname} detected game start for room ${roomCode}. Navigating.`);
      toast({ title: 'Game Starting!', description: 'Joining the game...' });
      router.push(`/game/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
    }
  }, [room?.isGameActive, isHost, isLoading, roomCode, currentNickname, router, toast]);


  const handleStartGame = () => {
    if (!room || !isHost || !currentPlayerInLobby) return;
    console.log(`[LobbyPage/handleStartGame] Host ${currentNickname} starting game for room ${roomCode}.`);
    
    const drawerId = room.players.length > 0 ? room.players[0].id : undefined;
    const updatedRoom: Room = { 
        ...room, 
        isGameActive: true, 
        currentDrawerId: drawerId, 
        maxRounds: maxRounds,
        round: 0, 
        messages: [{id: Date.now().toString(), nickname:"System", text: "Game started by host!", timestamp: Date.now(), isSystemMessage: true }]
    }; 
    
    let mockRoomsStorage: Record<string, Room> = {};
    try {
      const storedRooms = localStorage.getItem('scribbleRooms');
      if (storedRooms) mockRoomsStorage = JSON.parse(storedRooms);
    } catch (e) {
      console.error("[LobbyPage/handleStartGame] Failed to parse scribbleRooms from localStorage:", e);
    }
    mockRoomsStorage[roomCode] = updatedRoom;
    try {
      localStorage.setItem('scribbleRooms', JSON.stringify(mockRoomsStorage));
      console.log(`[LobbyPage/handleStartGame] Room ${roomCode} set to active and saved to localStorage.`);
    } catch (e) {
      console.error("[LobbyPage/handleStartGame] Failed to set scribbleRooms in localStorage:", e);
    }
    
    setRoom(updatedRoom); 
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
    if (navigator.share) {
      navigator.share({
        title: 'Join my Scribble Stadium game!',
        text: `Join my game in Scribble Stadium with room code: ${roomCode}`,
        url: window.location.href.split('?')[0], 
      })
      .then(() => toast({ title: 'Shared!', description: 'Invitation sent.'}))
      .catch((error) => console.log('[LobbyPage/handleShare] Error sharing:', error));
    } else {
      const joinUrl = window.location.href.split('?')[0];
      navigator.clipboard.writeText(joinUrl); 
      toast({ title: 'Link Copied', description: `Share this link with your friends: ${joinUrl}. They'll need the room code: ${roomCode} and to enter their nickname.` });
    }
  };
  
  const handleSettingsUpdate = () => {
    if (!room || !isHost) return;
    console.log(`[LobbyPage/handleSettingsUpdate] Host updating maxRounds to ${maxRounds} for room ${roomCode}.`);
    const updatedRoom = { ...room, maxRounds };
    
    let mockRoomsStorage: Record<string, Room> = {};
    try {
      const storedRooms = localStorage.getItem('scribbleRooms');
      if (storedRooms) mockRoomsStorage = JSON.parse(storedRooms);
    } catch (e) {
      console.error("[LobbyPage/handleSettingsUpdate] Failed to parse scribbleRooms from localStorage:", e);
    }
    mockRoomsStorage[roomCode] = updatedRoom;
    try {
      localStorage.setItem('scribbleRooms', JSON.stringify(mockRoomsStorage));
      console.log(`[LobbyPage/handleSettingsUpdate] Room ${roomCode} settings updated and saved to localStorage.`);
    } catch (e) {
      console.error("[LobbyPage/handleSettingsUpdate] Failed to set scribbleRooms in localStorage:", e);
    }
    setRoom(updatedRoom);
    toast({ title: 'Settings Updated', description: `Max rounds set to ${maxRounds}.`});
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Copy className="w-8 h-8 animate-spin text-primary" /> <span className="ml-2 text-xl">Loading Lobby...</span></div>;
  }

  if (!room) {
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
              <CardDescription className="text-lg">Waiting for players... The host ({room.players.find(p => p.id === room.hostId)?.nickname || 'Unknown'}) will start the game.</CardDescription>
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
                        <Button onClick={() => {
                            handleSettingsUpdate();
                        }}>Save Changes</Button>
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
              <Button onClick={handleStartGame} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg" disabled={room.players.length < 1 }>
                <Play className="mr-2 h-6 w-6" /> Start Game
              </Button>
            )}
            {!isHost && (
                <div className="text-center p-4 bg-secondary rounded-md">
                    <p className="text-muted-foreground font-semibold">Waiting for the host ({room.players.find(p => p.id === room.hostId)?.nickname || 'Host'}) to start the game.</p>
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
