export interface Player {
  id: string;
  nickname: string;
  score: number;
  isHost?: boolean;
  isDrawer?: boolean;
}

export interface Message {
  id: string;
  timestamp: number;
  nickname: string;
  text: string;
  isCorrectGuess?: boolean;
  isSystemMessage?: boolean;
}

export interface Room {
  roomCode: string;
  players: Player[];
  hostId: string;
  currentWord?: string;
  currentDrawerId?: string;
  timeLeft?: number;
  round?: number;
  maxRounds?: number;
  isGameActive: boolean;
  messages: Message[];
}

export interface DrawingData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  lineWidth: number;
}
