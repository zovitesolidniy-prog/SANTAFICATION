import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Info } from 'lucide-react';
import '@/SantaWorld.css';

const SantaWorld = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [santaCount, setSantaCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1600;
    canvas.height = 800;

    // Santa names pool
    const santaNames = [
      'Klaus', 'Jingle', 'Frosty', 'Rudolph', 'Snowman',
      'Blitzen', 'Dasher', 'Comet', 'Cupid', 'Prancer',
      'Vixen', 'Donner', 'Nick', 'Kris', 'Jolly',
      'Merry', 'Cheer', 'Holly', 'Ivy', 'Noel'
    ];

    // Buildings (top-down view)
    const buildings = [
      { x: 100, y: 150, width: 150, height: 120, color: '#8B4513', roofColor: '#c02425' },
      { x: 300, y: 100, width: 120, height: 140, color: '#A0522D', roofColor: '#a01f20' },
      { x: 480, y: 300, width: 160, height: 130, color: '#8B4513', roofColor: '#c02425' },
      { x: 700, y: 150, width: 130, height: 110, color: '#A0522D', roofColor: '#a01f20' },
      { x: 900, y: 250, width: 140, height: 140, color: '#8B4513', roofColor: '#c02425' },
      { x: 1100, y: 100, width: 135, height: 125, color: '#A0522D', roofColor: '#a01f20' },
      { x: 1300, y: 300, width: 150, height: 140, color: '#8B4513', roofColor: '#c02425' },
      { x: 200, y: 500, width: 110, height: 100, color: '#A0522D', roofColor: '#a01f20' },
      { x: 800, y: 550, width: 130, height: 120, color: '#8B4513', roofColor: '#c02425' },
      { x: 1200, y: 520, width: 140, height: 110, color: '#A0522D', roofColor: '#a01f20' }
    ];

    // Santa class
    class Santa {
      constructor() {
        this.x = Math.random() * (canvas.width - 40);
        this.y = canvas.height - 100;
        this.width = 16;
        this.height = 20;
        this.speed = 0.5 + Math.random() * 1.5;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.name = santaNames[Math.floor(Math.random() * santaNames.length)];
        this.jumpOffset = Math.random() * Math.PI * 2;
        this.showName = Math.random() > 0.7;
      }

      update() {
        this.x += this.speed * this.direction;
        
        // Bounce off edges
        if (this.x <= 0 || this.x >= canvas.width - this.width) {
          this.direction *= -1;
        }

        // Random direction change
        if (Math.random() < 0.01) {
          this.direction *= -1;
        }
      }

      draw() {
        // Simple pixel Santa
        // Hat
        ctx.fillStyle = '#c02425';
        ctx.fillRect(this.x + 3, this.y, 10, 6);
        // Hat pom
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 6, this.y - 2, 4, 4);
        
        // Face
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(this.x + 4, this.y + 6, 8, 6);
        
        // Beard
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 3, this.y + 10, 10, 4);
        
        // Body
        ctx.fillStyle = '#c02425';
        ctx.fillRect(this.x + 2, this.y + 14, 12, 6);
        
        // Arms
        ctx.fillStyle = '#c02425';
        ctx.fillRect(this.x, this.y + 15, 2, 3);
        ctx.fillRect(this.x + 14, this.y + 15, 2, 3);
        
        // Belt
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 2, this.y + 18, 12, 1);
        
        // Buckle
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.x + 6, this.y + 17, 4, 2);

        // Name label
        if (this.showName) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(this.x - 10, this.y - 15, 36, 12);
          ctx.fillStyle = '#fff';
          ctx.font = '8px "Press Start 2P"';
          ctx.fillText(this.name, this.x - 8, this.y - 7);
        }
      }
    }

    // Create Santas
    const santas = [];
    for (let i = 0; i < 20; i++) {
      santas.push(new Santa());
    }
    setSantaCount(santas.length);

    // Draw building
    function drawBuilding(building) {
      // Main building
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      // Roof
      ctx.fillStyle = building.roofColor;
      ctx.beginPath();
      ctx.moveTo(building.x - 10, building.y);
      ctx.lineTo(building.x + building.width / 2, building.y - 30);
      ctx.lineTo(building.x + building.width + 10, building.y);
      ctx.closePath();
      ctx.fill();

      // Windows
      const windowCols = Math.floor(building.windows / 3);
      const windowRows = Math.ceil(building.windows / windowCols);
      ctx.fillStyle = '#ffd700';
      
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const wx = building.x + 15 + col * 25;
          const wy = building.y + 20 + row * 35;
          if (wy < building.y + building.height - 20) {
            // Random lit/unlit windows
            ctx.fillStyle = Math.random() > 0.3 ? '#ffd700' : '#654321';
            ctx.fillRect(wx, wy, 18, 24);
            // Window frame
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(wx, wy, 18, 24);
          }
        }
      }

      // Door
      ctx.fillStyle = '#654321';
      ctx.fillRect(building.x + building.width / 2 - 15, building.y + building.height - 35, 30, 35);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(building.x + building.width / 2 - 15, building.y + building.height - 35, 30, 35);
    }

    // Snowflakes
    const snowflakes = [];
    for (let i = 0; i < 50; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.3 + Math.random() * 0.7,
        size: 2 + Math.random() * 2
      });
    }

    // Animation loop
    let animationId;
    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const x = (i * 123) % canvas.width;
        const y = (i * 234) % (canvas.height / 2);
        ctx.fillRect(x, y, 2, 2);
      }

      // Moon
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.arc(1400, 100, 40, 0, Math.PI * 2);
      ctx.fill();

      // Ground
      ctx.fillStyle = '#e8f5e9';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

      // Snow on ground
      ctx.fillStyle = '#fff';
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - 85, 15, 5);
      }

      // Draw buildings
      buildings.forEach(building => drawBuilding(building));

      // Update and draw snowflakes
      snowflakes.forEach(flake => {
        flake.y += flake.speed;
        if (flake.y > canvas.height) {
          flake.y = 0;
          flake.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = '#fff';
        ctx.fillRect(flake.x, flake.y, flake.size, flake.size);
      });

      // Update and draw Santas
      santas.forEach(santa => {
        santa.update();
        santa.draw();
      });

      // Info text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, 300, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '12px "Press Start 2P"';
      ctx.fillText(`Santa Town`, 20, 30);
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText(`${santas.length} Santas working`, 20, 45);

      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="santa-world">
      <div className="world-header">
        <h1 className="world-title" data-testid="world-title">
          <span className="world-title-text">SANTA TOWN</span>
        </h1>
        <Button
          onClick={() => navigate('/')}
          className="back-button"
          data-testid="back-button"
        >
          <Home size={16} />
          BACK HOME
        </Button>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="world-canvas" />
      </div>

      <div className="world-info">
        <div className="info-card">
          <Info size={20} />
          <p>Watch {santaCount} pixel Santas roaming around Santa Town!</p>
        </div>
      </div>
    </div>
  );
};

export default SantaWorld;