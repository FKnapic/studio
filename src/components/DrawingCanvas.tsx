
'use client';

import { useRef, useEffect, useState } from 'react';
import type { DrawingData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Eraser, Palette, Minus, Plus, Undo, Redo, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';


interface DrawingCanvasProps {
  width?: number;
  height?: number;
  isDrawer: boolean;
  onDraw?: (data: DrawingData) => void; // For sending data via sockets
  initialDrawingData?: DrawingData[]; // For receiving data
  wordToDraw?: string;
}

const colors = [
  "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#808080", "#A0522D", "#FFA500", "#800080", "#FFFFFF"
];

export default function DrawingCanvas({ width = 800, height = 600, isDrawer, onDraw, initialDrawingData, wordToDraw }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const prevPosRef = useRef<{ x: number; y: number } | null>(null);


  const getContext = () => canvasRef.current?.getContext('2d');

  const saveHistory = () => {
    const ctx = getContext();
    if (ctx && canvasRef.current) {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };
  
  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const ctx = getContext();
      if (ctx && canvasRef.current) {
        ctx.putImageData(history[newStep], 0, 0);
      }
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const ctx = getContext();
      if (ctx && canvasRef.current) {
        ctx.putImageData(history[newStep], 0, 0);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions based on parent container for responsiveness
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight * 0.9; // Use 90% of parent height
    }
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory(); // Save initial blank state

    if (initialDrawingData) {
      initialDrawingData.forEach(data => drawLine(context, data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth, false));
      saveHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDrawingData]);


  const drawLine = (
    context: CanvasRenderingContext2D,
    x0: number, y0: number, x1: number, y1: number,
    color: string, currentLineWidth: number, emit: boolean
  ) => {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = currentLineWidth;
    context.lineCap = 'round';
    context.stroke();
    context.closePath();

    if (emit && onDraw && isDrawer) {
      onDraw({ x0, y0, x1, y1, color, lineWidth: currentLineWidth });
    }
  };
  
  const getMousePosition = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };


  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    const pos = getMousePosition(event);
    if (!pos) return;

    setIsDrawing(true);
    prevPosRef.current = pos; // Store the starting position
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;

    const context = getContext();
    const currentPos = getMousePosition(event);

    if (!context || !currentPos) return;

    if (!prevPosRef.current) {
      // This case should ideally not be hit if startDrawing was called,
      // but as a fallback, initialize prevPosRef.current.
      prevPosRef.current = currentPos;
      return;
    }
    
    drawLine(context, prevPosRef.current.x, prevPosRef.current.y, currentPos.x, currentPos.y, currentColor, lineWidth, true);
    prevPosRef.current = currentPos; // Update for the next segment
  };

  const stopDrawing = () => {
    if (!isDrawer) return;
    setIsDrawing(false);
    // prevPosRef.current = null; // Optional: reset, but isDrawing guard handles it
    saveHistory(); // Save the completed stroke
  };

  const clearCanvas = () => {
    const context = getContext();
    if (context && canvasRef.current) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      // TODO: emit clear event if needed via onDraw or a dedicated callback
      saveHistory();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'scribble.png';
      link.click();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-2xl overflow-hidden">
        {isDrawer && wordToDraw && (
            <div className="p-2 bg-primary text-primary-foreground text-center font-semibold text-lg rounded-t-md">
                Your word to draw: <span className="text-accent font-bold tracking-wider">{wordToDraw}</span>
            </div>
        )}
        {!isDrawer && (
            <div className="p-2 bg-secondary text-secondary-foreground text-center font-semibold text-lg rounded-t-md">
                Guess the drawing!
            </div>
        )}
      <CardContent className="p-0 flex-grow relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair bg-white rounded-b-md touch-none"
          // width and height are set by useEffect based on parent
        />
      </CardContent>
      {isDrawer && (
        <div className="p-2 border-t bg-card flex flex-wrap items-center justify-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Color">
                <Palette style={{ color: currentColor }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {colors.map(color => (
                  <Button
                    key={color}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8"
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} title="Decrease Brush Size"><Minus /></Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-10 h-10 p-0">
                        <div className="rounded-full bg-foreground" style={{width: `${lineWidth}px`, height: `${lineWidth}px`}}></div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                   <Slider defaultValue={[lineWidth]} max={30} min={1} step={1} onValueChange={(value) => setLineWidth(value[0])}/>
                </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => setLineWidth(Math.min(30, lineWidth + 1))} title="Increase Brush Size"><Plus /></Button>
          </div>

          <Button variant="outline" size="icon" onClick={undo} disabled={historyStep <= 0} title="Undo"><Undo /></Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={historyStep >= history.length - 1} title="Redo"><Redo /></Button>
          <Button variant="outline" size="icon" onClick={() => {setCurrentColor('#FFFFFF');}} title="Eraser"><Eraser /></Button>
          <Button variant="destructive" size="sm" onClick={clearCanvas}>Clear</Button>
          <Button variant="outline" size="icon" onClick={downloadImage} title="Download Drawing"><Download /></Button>
        </div>
      )}
    </Card>
  );
}

