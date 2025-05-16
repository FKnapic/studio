
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DrawingCanvas from '@/components/DrawingCanvas';
import ChatBox from '@/components/ChatBox';
import PlayerList from '@/components/PlayerList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Player, Room, Message, DrawingData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, AlertTriangle, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// Mock a function to get room details, in a real app this would be an API/socket call
const fetchGameRoomDetails = async (roomCode: string, nickname: string): Promise<Room | null> => {
  console.log(`Fetching game room ${roomCode} for ${nickname}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  let mockRooms = {};
  try {
    const storedRooms = localStorage.getItem('scribbleRooms');
    if (storedRooms) {
      mockRooms = JSON.parse(storedRooms);
    }
  } catch (e) {
    console.error("Failed to parse scribbleRooms from localStorage in fetchGameRoomDetails:", e);
    // mockRooms remains {}
  }
  
  const rooms = mockRooms as Record<string, Room>;

  if (rooms[roomCode]) {
    const room = rooms[roomCode];
    // Ensure player is in room (might have joined through lobby)
    if (!room.players.find((p: Player) => p.nickname === nickname)) {
      room.players.push({ id: Math.random().toString(36).substring(7), nickname, score: 0 });
    }
    // Initialize game state if not active
    if (!room.isGameActive) {
      room.isGameActive = true;
      room.round = 1;
      room.currentDrawerId = room.players[0]?.id || 'mock_drawer_id';
      room.currentWord = 'HOUSE'; // Mock word
      room.timeLeft = 60;
      if (!room.messages) room.messages = [];
       room.messages.push({ id: Date.now().toString(), nickname: 'System', text: `Round 1! ${room.players.find((p: Player) => p.id === room.currentDrawerId)?.nickname || 'Drawer'} is drawing.`, timestamp: Date.now(), isSystemMessage: true });
    }
    rooms[roomCode] = room;
    try {
      localStorage.setItem('scribbleRooms', JSON.stringify(rooms));
    } catch (e) {
      console.error("Failed to set scribbleRooms in localStorage in fetchGameRoomDetails:", e);
    }
    return room;
  }
  return null;
};

const mockWords = ['Apple', 'Banana', 'Car', 'House', 'Tree', 'Guitar', 'Star', 'Cloud', 'Book', 'Phone'];
const getRandomWord = () => mockWords[Math.floor(Math.random() * mockWords.length)];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomCode = params.roomCode as string;
  const currentNickname = searchParams.get('nickname') || 'Player';

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentPlayer = room?.players.find(p => p.nickname === currentNickname);
  const isDrawer = currentPlayer?.id === room?.currentDrawerId;

  const loadRoomData = useCallback(async () => {
    setIsLoading(true);
    if (!roomCode || !currentNickname) {
      toast({ title: "Error", description: "Missing room or player information.", variant: "destructive"});
      router.push('/');
      return;
    }
    const roomData = await fetchGameRoomDetails(roomCode, currentNickname);
    if (roomData) {
      setRoom(roomData);
    } else {
      toast({ title: 'Error', description: 'Game room not found.', variant: 'destructive' });
      router.push('/');
    }
    setIsLoading(false);
  }, [roomCode, currentNickname, router, toast]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Game Timer & Round Logic (Simplified Mock)
  useEffect(() => {
    if (!room || !room.isGameActive || room.timeLeft === undefined) return;

    if (room.timeLeft <= 0) {
      // End of round
      const currentRound = room.round || 1;
      const maxRounds = room.maxRounds || 3;

      let newMessages = [...(room.messages || [])];
      newMessages.push({ id: Date.now().toString(), nickname: 'System', text: `Time's up! The word was: ${room.currentWord}`, timestamp: Date.now(), isSystemMessage: true });

      if (currentRound >= maxRounds * room.players.length) { // Each player draws maxRounds times
        // Game Over
        toast({ title: "Game Over!", description: "Check the final scores!"});
        const updatedRoom = { ...room, isGameActive: false, messages: newMessages };
        let mockRooms = {};
        try {
          const storedRooms = localStorage.getItem('scribbleRooms');
          if (storedRooms) mockRooms = JSON.parse(storedRooms);
        } catch (e) { console.error("Failed to parse scribbleRooms from localStorage in timer (game over):", e); }
        
        const rooms = mockRooms as Record<string, Room>;
        rooms[roomCode] = updatedRoom;
        try {
          localStorage.setItem('scribbleRooms', JSON.stringify(rooms));
        } catch (e) { console.error("Failed to set scribbleRooms in localStorage in timer (game over):", e); }
        setRoom(updatedRoom);
        router.push(`/gameover/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
        return;
      } else {
        // Next round/turn
        const currentPlayerIndex = room.players.findIndex(p => p.id === room.currentDrawerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
        const nextDrawer = room.players[nextPlayerIndex];
        const newWord = getRandomWord();
        
        newMessages.push({ id: (Date.now()+1).toString(), nickname: 'System', text: `Round ${Math.floor(currentRound / room.players.length) + 1}! ${nextDrawer.nickname} is drawing.`, timestamp: Date.now(), isSystemMessage: true });

        const updatedRoom = {
          ...room,
          round: currentRound + 1,
          currentDrawerId: nextDrawer.id,
          currentWord: newWord,
          timeLeft: 60,
          messages: newMessages,
        };
        let mockRooms = {};
        try {
          const storedRooms = localStorage.getItem('scribbleRooms');
          if (storedRooms) mockRooms = JSON.parse(storedRooms);
        } catch (e) { console.error("Failed to parse scribbleRooms from localStorage in timer (next round):", e); }

        const rooms = mockRooms as Record<string, Room>;
        rooms[roomCode] = updatedRoom;
        try {
          localStorage.setItem('scribbleRooms', JSON.stringify(rooms));
        } catch (e) { console.error("Failed to set scribbleRooms in localStorage in timer (next round):", e); }
        setRoom(updatedRoom);
        toast({ title: "Next Round!", description: `${nextDrawer.nickname} is now drawing.`});
      }
      return;
    }

    const timerId = setTimeout(() => {
      setRoom(prevRoom => prevRoom ? { ...prevRoom, timeLeft: prevRoom.timeLeft! - 1 } : null);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [room, router, roomCode, currentNickname, toast]);


  const handleSendMessage = (text: string) => {
    if (!room) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      nickname: currentNickname,
      text,
    };
    
    let scoreIncrement = 0;
    if (!isDrawer && room.currentWord && text.toLowerCase() === room.currentWord.toLowerCase()) {
      newMessage.isCorrectGuess = true;
      scoreIncrement = Math.max(10, Math.floor((room.timeLeft || 0) / 2)); // Example scoring
      toast({
        title: 'Correct!',
        description: `You guessed the word! +${scoreIncrement} points.`,
        className: 'bg-accent text-accent-foreground border-green-600',
      });
       newMessage.text = `${currentNickname} guessed the word!`;
       newMessage.isSystemMessage = true; // Make it a system message to stand out
    }

    const updatedPlayers = room.players.map(p => 
      p.nickname === currentNickname && scoreIncrement > 0
        ? { ...p, score: p.score + scoreIncrement }
        : p
    );

    const updatedRoom = { ...room, messages: [...room.messages, newMessage], players: updatedPlayers };
    
    let mockRooms = {};
    try {
      const storedRooms = localStorage.getItem('scribbleRooms');
      if (storedRooms) mockRooms = JSON.parse(storedRooms);
    } catch (e) { console.error("Failed to parse scribbleRooms from localStorage in handleSendMessage:", e); }
    
    const rooms = mockRooms as Record<string, Room>;
    rooms[roomCode] = updatedRoom;
    try {
      localStorage.setItem('scribbleRooms', JSON.stringify(rooms));
    } catch (e) { console.error("Failed to set scribbleRooms in localStorage in handleSendMessage:", e); }
    setRoom(updatedRoom);

    // If correct guess, might trigger round end early (not implemented in this mock)
  };

  const handleDraw = (data: DrawingData) => {
    // In a real app, emit this data via socket.io
    // For mock, we can store it in localStorage if needed for other clients to "see"
    // This part is highly dependent on real-time backend.
    // console.log('Drawing data:', data);
  };
  

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Clock className="w-12 h-12 animate-spin text-primary" /> <span className="ml-4 text-2xl">Loading Game...</span></div>;
  }

  if (!room || !currentPlayer) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Game</h2>
        <p className="text-muted-foreground mb-4">Could not load game details. The room might not exist or you are not part of it.</p>
        <Button onClick={() => router.push('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Go to Homepage
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)] max-h-[800px]">
      {/* Left Column: Scoreboard */}
      <div className="lg:w-1/4 space-y-4 flex flex-col">
        <PlayerList players={room.players} currentDrawerId={room.currentDrawerId} hostId={room.hostId} />
      </div>

      {/* Middle Column: Drawing Canvas & Timer/Word */}
      <div className="lg:w-1/2 flex flex-col gap-2">
        <Card className="p-2 text-center bg-card shadow">
            <div className="flex justify-between items-center">
                <p className="text-lg font-medium">
                    Round: <span className="font-bold text-primary">{Math.floor((room.round || 0) / room.players.length) + 1} / {room.maxRounds}</span>
                </p>
                <p className="text-2xl font-bold text-destructive flex items-center">
                    <Clock className="w-6 h-6 mr-2" /> {room.timeLeft}s
                </p>
            </div>
          {!isDrawer && room.currentWord && (
            <p className="text-3xl font-bold tracking-widest my-2">
              {room.currentWord.split('').map(char => char === ' ' ? ' ' : '_').join(' ')}
              <span className="text-sm ml-2">({room.currentWord.length} letters)</span>
            </p>
          )}
        </Card>
        <div className="flex-grow min-h-[300px] lg:min-h-0"> {/* Ensure canvas container has min height */}
          <DrawingCanvas
            isDrawer={isDrawer}
            onDraw={handleDraw}
            wordToDraw={isDrawer ? room.currentWord : undefined}
            // initialDrawingData={room.drawingData || []} // Pass drawing data if available
          />
        </div>
      </div>

      {/* Right Column: ChatBox */}
      <div className="lg:w-1/4 flex flex-col">
        <ChatBox messages={room.messages} onSendMessage={handleSendMessage} currentNickname={currentNickname} disabled={!room.isGameActive}/>
      </div>
      
      {!room.isGameActive && room.round && room.round >= (room.maxRounds || 3) * room.players.length && (
        // This implies game is over but we are still on game page (before redirect)
         <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Game Over!</AlertDialogTitle>
              <AlertDialogDescription>
                The game has finished. Let's see the final scores!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => router.push(`/gameover/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`)}>
                View Results
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

