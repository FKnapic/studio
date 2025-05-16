
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
import { ChevronLeft, AlertTriangle, Clock, Loader2 } from 'lucide-react';
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


// This function would be replaced by data received from server via WebSockets.
const initializeGameRoom = (roomCode: string, nickname: string): Room => {
  console.log(`[GamePage/initializeGameRoom] Initializing basic room structure for ${roomCode}, player ${nickname}`);
  // Return a minimal structure. Server would provide the full, current state.
  const currentPlayerId = Math.random().toString(36).substring(7);
  return {
    roomCode,
    players: [{ id: currentPlayerId, nickname, score: 0 }], // Current player as a placeholder
    hostId: 'unknown_host', // Server would provide
    isGameActive: false, // Server would set this to true
    messages: [],
    currentWord: "LOADING...",
    currentDrawerId: undefined,
    timeLeft: 60,
    round: 1,
    maxRounds: 3,
  };
};

// const mockWords = ['Apple', 'Banana', 'Car', 'House', 'Tree', 'Guitar', 'Star', 'Cloud', 'Book', 'Phone'];
// const getRandomWord = () => mockWords[Math.floor(Math.random() * mockWords.length)]; // Word generation would be server-side

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomCode = params.roomCode as string;
  const currentNickname = searchParams.get('nickname') || 'Player';

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [drawingHistoryForCanvas, setDrawingHistoryForCanvas] = useState<DrawingData[]>([]); // Server would provide this

  const currentPlayer = room?.players.find(p => p.nickname === currentNickname);
  const isDrawer = currentPlayer?.id === room?.currentDrawerId;

  useEffect(() => {
    setIsLoading(true);
    if (!roomCode || !currentNickname) {
      toast({ title: "Error", description: "Missing room or player information.", variant: "destructive"});
      router.push('/');
      return;
    }

    // In a WebSocket setup:
    // 1. Ensure socket connection.
    // 2. Emit 'joinGameScreen' or similar event to server with roomCode & nickname.
    //    socket.emit('joinGameScreen', { roomCode, nickname: currentNickname });
    // 3. Server sends back 'gameRoomDetails' or error.

    // For now, initialize with a basic structure.
    const initialRoom = initializeGameRoom(roomCode, currentNickname);
    setRoom(initialRoom);
    // setIsLoading(false); // Set to false once actual server data is received or if mocking initial load

    // Setup socket listeners for game events
    // Example:
    // socket.on('gameRoomDetails', (details: Room) => {
    //   setRoom(details);
    //   // if (details.drawingHistory) setDrawingHistoryForCanvas(details.drawingHistory);
    //   setIsLoading(false);
    // });
    // socket.on('newDrawingData', (data: DrawingData) => {
    //    // This would be handled by the DrawingCanvas itself if it receives live data
    //    // Or, update a shared drawing history state.
    //    // setDrawingHistoryForCanvas(prev => [...prev, data]);
    // });
    // socket.on('newMessage', (message: Message) => {
    //   setRoom(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
    // });
    // socket.on('playerUpdate', (updatedPlayers: Player[]) => {
    //   setRoom(prev => prev ? { ...prev, players: updatedPlayers } : null);
    // });
    // socket.on('nextTurn', (turnInfo: { currentDrawerId: string, currentWord: string, round: number }) => {
    //   setRoom(prev => prev ? { ...prev, ...turnInfo, timeLeft: 60 /* reset timer */ } : null);
    //   toast({ title: "Next Turn!", description: `${room?.players.find(p=>p.id === turnInfo.currentDrawerId)?.nickname} is drawing.` });
    //   // clear canvas or DrawingCanvas handles new turn
    // });
    // socket.on('timerUpdate', (timeLeft: number) => {
    //   setRoom(prev => prev ? { ...prev, timeLeft } : null);
    // });
    // socket.on('wordHint', (hint: string) => { // Example for word length display
    //    setRoom(prev => prev ? { ...prev, currentWord: hint /* e.g. "_____" */ } : null);
    // });
    // socket.on('gameOver', (finalRoomState: Room) => {
    //   setRoom(finalRoomState); // Update with final scores
    //   toast({ title: "Game Over!", description: "Check the final scores!"});
    //   router.push(`/gameover/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`);
    // });
    // socket.on('playerGuessedWord', (message: Message, updatedPlayers: Player[]) => {
    //    setRoom(prev => prev ? { ...prev, messages: [...prev.messages, message], players: updatedPlayers } : null);
    //    if (message.nickname === currentNickname) {
    //       toast({ title: 'Correct!', description: `You guessed the word!`, className: 'bg-accent text-accent-foreground' });
    //    }
    // });


    // Simulate initial data load from "server"
    // In a real app, isLoading would be true until 'gameRoomDetails' is received.
    setTimeout(() => {
        // This would be a mock of receiving initial game state.
        // In a real scenario, the server sends the *actual* current state.
        const mockInitialServerData: Room = {
            roomCode,
            players: [{ id: Math.random().toString(36).substring(7), nickname: currentNickname, score: 0, isHost: false }], // Add current player
            hostId: 'mock_host_id',
            isGameActive: true,
            currentDrawerId: currentNickname, // Let current player draw initially for mock
            currentWord: 'TESTWORD', // Mock word from server
            timeLeft: 60,
            round: 1,
            maxRounds: 3,
            messages: [{ id: Date.now().toString(), nickname: 'System', text: `Game started! ${currentNickname} is drawing.`, timestamp: Date.now(), isSystemMessage: true }],
        };
        setRoom(mockInitialServerData);
        setIsLoading(false);
    }, 1000);


    // return () => {
    //   // Clean up socket listeners
    //   socket.off('gameRoomDetails');
    //   // ... other listeners
    // };
  }, [roomCode, currentNickname, router, toast]);

  // Game Timer & Round Logic: This would largely be server-controlled.
  // The client would listen for 'timerUpdate', 'nextTurn', 'gameOver' events.
  // The useEffect for timer on client side can be removed or simplified to only reflect server state.
  // For now, commenting out the complex client-side timer and round logic.
  /*
  useEffect(() => {
    if (!room || !room.isGameActive || room.timeLeft === undefined) return;

    if (room.timeLeft <= 0) {
      // Server would handle this and emit 'nextTurn' or 'gameOver'
      return;
    }

    const timerId = setTimeout(() => {
      // Client doesn't decrement timer; it receives updates from server
      // setRoom(prevRoom => prevRoom ? { ...prevRoom, timeLeft: prevRoom.timeLeft! - 1 } : null);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [room]); // Dependency on room.timeLeft would cause re-run if server sends updates
  */


  const handleSendMessage = (text: string) => {
    if (!room || !currentPlayer) return;

    // In a WebSocket setup:
    // socket.emit('sendMessage', { roomCode, nickname: currentNickname, text });
    // Server handles guess checking, scoring, and broadcasts 'newMessage' and 'playerUpdate'.

    // Mock client-side handling for now (will not sync with others)
    const newMessage: Message = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      nickname: currentNickname,
      text,
    };
    
    let scoreIncrement = 0;
    let guessedCorrectly = false;
    if (!isDrawer && room.currentWord && text.toLowerCase() === room.currentWord.toLowerCase()) {
      newMessage.isCorrectGuess = true;
      guessedCorrectly = true;
      scoreIncrement = Math.max(10, Math.floor((room.timeLeft || 0) / 2));
      toast({
        title: 'Correct!',
        description: `You guessed the word! +${scoreIncrement} points. (Client-side mock)`,
        className: 'bg-accent text-accent-foreground border-green-600',
      });
       newMessage.text = `${currentNickname} guessed the word!`;
       newMessage.isSystemMessage = true;
    }

    const updatedPlayers = room.players.map(p => 
      p.id === currentPlayer.id && scoreIncrement > 0
        ? { ...p, score: p.score + scoreIncrement }
        : p
    );
    setRoom(prev => prev ? { ...prev, messages: [...prev.messages, newMessage], players: updatedPlayers } : null);
    
    // If guessed correctly, server would typically advance the turn or round.
  };

  const handleDraw = (data: DrawingData) => {
    if (!isDrawer) return;
    // In a WebSocket setup:
    // socket.emit('drawingData', { roomCode, drawingData: data });
    // Server broadcasts 'newDrawingData' to other clients in the room.
    // console.log('Drawing data (would be sent via socket):', data);
  };
  

  if (isLoading || !room) { // Added !room check for initial state
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /> <span className="ml-4 text-2xl">Loading Game...</span></div>;
  }

  if (!room.isGameActive && room.round && room.round >= (room.maxRounds || 3) * room.players.length) {
     // Game is over, but we might be waiting for server to push to gameover screen
  } else if (!room.isGameActive && !isLoading) { // If not loading and game not active (e.g. initial state before server confirms)
     return (
      <div className="text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Waiting for Game</h2>
        <p className="text-muted-foreground mb-4">The game is not yet active or details are loading.</p>
        <Button onClick={() => router.push('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Go to Homepage
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)] max-h-[800px]">
      <div className="lg:w-1/4 space-y-4 flex flex-col">
        <PlayerList players={room.players} currentDrawerId={room.currentDrawerId} hostId={room.hostId} />
      </div>

      <div className="lg:w-1/2 flex flex-col gap-2">
        <Card className="p-2 text-center bg-card shadow">
            <div className="flex justify-between items-center">
                <p className="text-lg font-medium">
                    Round: <span className="font-bold text-primary">{Math.floor((room.round || 0) / (room.players.length || 1)) + 1} / {room.maxRounds}</span>
                </p>
                <p className="text-2xl font-bold text-destructive flex items-center">
                    <Clock className="w-6 h-6 mr-2" /> {room.timeLeft}s
                </p>
            </div>
          {!isDrawer && room.currentWord && (
            <p className="text-3xl font-bold tracking-widest my-2">
              {/* Word display logic would depend on server (e.g., sending underscores) */}
              {room.currentWord.split('').map((char: string) => char === ' ' ? ' ' : '_').join(' ')}
              <span className="text-sm ml-2">({room.currentWord.length} letters)</span>
            </p>
          )}
        </Card>
        <div className="flex-grow min-h-[300px] lg:min-h-0">
          <DrawingCanvas
            isDrawer={isDrawer}
            onDraw={handleDraw}
            wordToDraw={isDrawer ? room.currentWord : undefined}
            // initialDrawingData={drawingHistoryForCanvas} // Pass drawing data if available from server
          />
        </div>
      </div>

      <div className="lg:w-1/4 flex flex-col">
        <ChatBox messages={room.messages} onSendMessage={handleSendMessage} currentNickname={currentNickname} disabled={!room.isGameActive}/>
      </div>
      
      {/* Game Over dialog - server would dictate when game is truly over and trigger navigation */}
      {/*!room.isGameActive && room.round && room.round >= (room.maxRounds || 3) * room.players.length && (
         <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Game Over!</AlertDialogTitle>
              <AlertDialogDescription>
                The game has finished. The server will redirect you shortly.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => router.push(`/gameover/${roomCode}?nickname=${encodeURIComponent(currentNickname)}`)}>
                View Results (Manual)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )*/}
    </div>
  );
}
