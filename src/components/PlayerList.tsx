
import type { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Crown, Edit3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlayerListProps {
  players: Player[];
  currentDrawerId?: string;
  hostId?: string;
}

export default function PlayerList({ players, currentDrawerId, hostId }: PlayerListProps) {
  if (!players || players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No players yet. Waiting for players to join...</p>
        </CardContent>
      </Card>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Players ({sortedPlayers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60">
          <ul className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <li
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ease-in-out
                  ${player.id === currentDrawerId ? 'bg-primary/10 ring-2 ring-primary' : 'bg-secondary/50'}
                  ${index === 0 && player.score > 0 ? 'border-l-4 border-yellow-400' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-lg">{player.nickname}</span>
                  {player.id === hostId && (
                    <span title="Host">
                      <Crown className="w-4 h-4 text-yellow-500" />
                    </span>
                  )}
                  {player.id === currentDrawerId && (
                    <span title="Drawing">
                      <Edit3 className="w-4 h-4 text-primary" />
                    </span>
                  )}
                </div>
                <span className="font-bold text-xl text-primary">{player.score}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
