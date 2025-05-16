
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlayerList from '@/components/PlayerList';
import type { Player, Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Home, RefreshCw, Users, Loader2 } from 'lucide-react';
import Confetti from 'react-confetti';

// This function would be replaced by data received from server via WebSockets or an API call.
const fetchFinalRoomDetailsMock = async (roomCode: string, nickname: string): Promise<Room | null> => {
  console.log(`[GameOverPage/fetchFinalRoomDetailsMock] Simulating fetch for room ${roomCode}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real app, this data comes from the server.
  // For now, return a mock structure.
  const mockWinner: Player = {id: 'winner-id', nickname: nickname, score: 100, isHost: false};
  const mockOtherPlayer: Player = {id: 'other-player-id', nickname: "BotPlayer", score: 50, isHost: false};
  
  return {
    roomCode,
    players: [mockWinner, mockOtherPlayer].sort((a,b) => b.score - a.score),
    hostId: 'some-host-id', // Server provides
    isGameActive: false, // Game is over
    messages: [],
    maxRounds: 3,
    round: 3 * 2, // Example: 3 rounds, 2 players
  };
};

export default function GameOverPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomCode = params.roomCode as string;
  const nickname = searchParams.get('nickname') || 'Player';

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });


  const loadFinalData = useCallback(async () => {
    setIsLoading(true);
    // In a WebSocket setup:
    // The server might have already pushed to this page with state, or client confirms with server.
    // socket.emit('getFinalScores', { roomCode });
    // socket.on('finalScores', (roomData: Room) => { ... });

    const roomData = await fetchFinalRoomDetailsMock(roomCode, nickname); // Using mock
    if (roomData) {
      setRoom(roomData);
      if (roomData.players && roomData.players.length > 0) {
        const sortedPlayers = [...roomData.players].sort((a, b) => b.score - a.score);
        setWinner(sortedPlayers[0]);
        if (sortedPlayers[0].nickname === nickname) { // Only show confetti if current player is winner
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 8000);
        }
      }
    } else {
      toast({ title: 'Error', description: 'Could not load game results.', variant: 'destructive' });
      // router.push('/'); // Potentially redirect if no data
    }
    setIsLoading(false);
  }, [roomCode, nickname, router, toast]);

  useEffect(() => {
    loadFinalData();
    const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [loadFinalData]);


  const handlePlayAgain = () => {
    // In a WebSocket setup:
    // socket.emit('requestPlayAgain', { roomCode, nickname });
    // Server would then manage resetting the room state and potentially navigating players back to lobby or new game.
    toast({ title: "Play Again Clicked", description: "Returning to lobby (mock)."});
    if (room) {
      // Navigate to lobby, server would handle actual room reset.
      router.push(`/lobby/${roomCode}?nickname=${encodeURIComponent(nickname)}&action=create`); // Rejoin/recreate lobby
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-bounce text-primary" /> <span className="ml-4 text-2xl">Loading Results...</span></div>;
  }

  if (!room || !winner) { // If no room data or winner after loading, show error
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-8 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <CardTitle className="text-2xl font-semibold">Error Displaying Results</CardTitle>
        <CardDescription>Could not display game results. The game data might be missing.</CardDescription>
        <Button onClick={() => router.push('/')} className="mt-4">
            <Home className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-8">
      {showConfetti && winner?.nickname === nickname && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />}
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-4" />
          <CardTitle className="text-4xl font-bold text-primary">Game Over!</CardTitle>
          {winner && (
            <CardDescription className="text-2xl mt-2">
              Congratulations <span className="font-semibold text-accent">{winner.nickname}</span>!
            </CardDescription>
          )}
           <p className="text-muted-foreground">You are the Scribble Champion!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-3 flex items-center justify-center gap-2">
                <Users className="w-6 h-6"/> Final Scores
            </h3>
            <PlayerList players={room.players} hostId={room.hostId}/> {/* Pass hostId if available and relevant */}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button onClick={handlePlayAgain} className="w-full sm:w-auto text-lg py-3">
            <RefreshCw className="mr-2 h-5 w-5" /> Play Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full sm:w-auto text-lg py-3">
            <Home className="mr-2 h-5 w-5" /> Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
