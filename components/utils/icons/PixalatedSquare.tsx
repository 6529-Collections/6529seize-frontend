import { useEffect, useRef } from 'react';

// Function to hash the JSON input
async function hashJsonInput(jsonInput: object): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(jsonInput));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple PRNG using a linear congruential generator
function createPRNG(seed: number) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// 8-bit color palette
const colorPalette = [
  '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
];

// Function to generate pixel data
function generatePixelData(prng: () => number, gridSize: number) {
  const pixelData = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    const colorIndex = Math.floor(prng() * colorPalette.length);
    pixelData.push(colorPalette[colorIndex]);
  }
  return pixelData;
}

// Function to render the pixelated square with larger squares
function renderPixelatedSquare(canvas: HTMLCanvasElement, pixelData: string[], squareSize: number, gridSize: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = gridSize * squareSize;
  canvas.height = gridSize * squareSize;
  for (let i = 0; i < pixelData.length; i++) {
    const color = pixelData[i];
    const x = (i % gridSize) * squareSize;
    const y = Math.floor(i / gridSize) * squareSize;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, squareSize, squareSize);
  }
}

const PixelatedSquare = ({ jsonInput }: { jsonInput: object }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const squareSize = 10; // Size of each larger square
  const gridSize = 3; // Number of larger squares per row/column (24 / 4 = 6)

  useEffect(() => {
    const generateAndRender = async () => {
      const hash = await hashJsonInput(jsonInput);
      const seed = parseInt(hash.slice(0, 8), 16); // Use first 8 characters of hash as seed
      const prng = createPRNG(seed);
      const pixelData = generatePixelData(prng, gridSize);
      if (canvasRef.current) {
        renderPixelatedSquare(canvasRef.current, pixelData, squareSize, gridSize);
      }
    };

    generateAndRender();
  }, [jsonInput]);

  return <canvas ref={canvasRef}></canvas>;
};

export default PixelatedSquare;