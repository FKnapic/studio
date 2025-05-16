
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlayerList from '@/components/PlayerList';
import type { Player, Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Home, RefreshCw, Users } from 'lucide-react';
import Confetti from 'react-confetti'; // Added for celebration

// Mock function to get final room details, usually from a persisted state or API
const fetchFinalRoomDetails = async (roomCode: string): Promise<Room | null> => {
  console.log(`Fetching final details for room ${roomCode}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  let mockRooms = {};
  try {
    const storedRooms = localStorage.getItem('scribbleRooms');
    if (storedRooms) {
      mockRooms = JSON.parse(storedRooms);
    }
  } catch (e) {
    console.error("Failed to parse scribbleRooms from localStorage in fetchFinalRoomDetails:", e);
    // mockRooms remains {}
  }
  const rooms = mockRooms as Record<string, Room>;
  return rooms[roomCode] || null;
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
    const roomData = await fetchFinalRoomDetails(roomCode);
    if (roomData) {
      setRoom(roomData);
      if (roomData.players && roomData.players.length > 0) {
        const sortedPlayers = [...roomData.players].sort((a, b) => b.score - a.score);
        setWinner(sortedPlayers[0]);
        setShowConfetti(true); 
        setTimeout(() => setShowConfetti(false), 8000); // Confetti for 8 seconds
      }
    } else {
      toast({ title: 'Error', description: 'Could not load game results.', variant: 'destructive' });
      router.push('/');
    }
    setIsLoading(false);
  }, [roomCode, router, toast]);

  useEffect(() => {
    loadFinalData();
    const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size
    return () => window.removeEventListener('resize', handleResize);
  }, [loadFinalData]);


  const handlePlayAgain = () => {
    // Reset game state for the room (mock)
    if (room) {
      const resetRoom: Room = {
        ...room,
        isGameActive: false,
        round: 0,
        currentWord: undefined,
        currentDrawerId: undefined,
        timeLeft: undefined,
        messages: [],
        players: room.players.map(p => ({ ...p, score: 0 })), // Reset scores
      };
      let mockRooms = {};
      try {
        const storedRooms = localStorage.getItem('scribbleRooms');
        if (storedRooms) mockRooms = JSON.parse(storedRooms);
      } catch (e) {
        console.error("Failed to parse scribbleRooms from localStorage in handlePlayAgain:", e);
      }
      const rooms = mockRooms as Record<string, Room>;
      rooms[roomCode] = resetRoom;
      try {
        localStorage.setItem('scribbleRooms', JSON.stringify(rooms));
      } catch (e) {
        console.error("Failed to set scribbleRooms in localStorage in handlePlayAgain:", e);
      }
      router.push(`/lobby/${roomCode}?nickname=${encodeURIComponent(nickname)}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Trophy className="w-12 h-12 animate-bounce text-primary" /> <span className="ml-4 text-2xl">Loading Results...</span></div>;
  }

  if (!room || !winner) {
    return <div className="text-center text-xl text-destructive py-10">Could not display game results.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-8">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />}
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
            <PlayerList players={room.players} />
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
