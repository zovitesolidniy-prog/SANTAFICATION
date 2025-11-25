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

    // Coin notifications
    const coinNotifications = [];

    // Buildings (top-down view)
    const buildings = [
      { x: 100, y: 150, width: 150, height: 120, color: '#8B4513', roofColor: '#c02425', coins: 0 },
      { x: 300, y: 100, width: 120, height: 140, color: '#A0522D', roofColor: '#a01f20', coins: 0 },
      { x: 480, y: 300, width: 160, height: 130, color: '#8B4513', roofColor: '#c02425', coins: 0 },
      { x: 700, y: 150, width: 130, height: 110, color: '#A0522D', roofColor: '#a01f20', coins: 0 },
      { x: 900, y: 250, width: 140, height: 140, color: '#8B4513', roofColor: '#c02425', coins: 0 },
      { x: 1100, y: 100, width: 135, height: 125, color: '#A0522D', roofColor: '#a01f20', coins: 0 },
      { x: 1300, y: 300, width: 150, height: 140, color: '#8B4513', roofColor: '#c02425', coins: 0 },
      { x: 200, y: 500, width: 110, height: 100, color: '#A0522D', roofColor: '#a01f20', coins: 0 },
      { x: 800, y: 550, width: 130, height: 120, color: '#8B4513', roofColor: '#c02425', coins: 0 },
      { x: 1200, y: 520, width: 140, height: 110, color: '#A0522D', roofColor: '#a01f20', coins: 0 }
    ];

    // Santa class
    class Santa {
      constructor(index) {
        this.x = Math.random() * (canvas.width - 40);
        this.y = Math.random() * (canvas.height - 40);
        this.width = 16;
        this.height = 16;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.name = santaNames[index % santaNames.length];
        this.showName = true;
        this.hasCoin = true;
        this.targetBuilding = null;
      }

      update() {
        // Find nearest building if has coin and no target
        if (this.hasCoin && !this.targetBuilding) {
          let nearestDist = Infinity;
          buildings.forEach(building => {
            const centerX = building.x + building.width / 2;
            const centerY = building.y + building.height / 2;
            const dist = Math.hypot(centerX - this.x, centerY - this.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              this.targetBuilding = building;
            }
          });
        }

        // Move towards target building if has coin
        if (this.hasCoin && this.targetBuilding) {
          const centerX = this.targetBuilding.x + this.targetBuilding.width / 2;
          const centerY = this.targetBuilding.y + this.targetBuilding.height / 2;
          const dx = centerX - this.x;
          const dy = centerY - this.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 30) {
            // Delivered!
            this.hasCoin = false;
            this.targetBuilding.coins++;
            coinNotifications.push({
              x: this.targetBuilding.x + this.targetBuilding.width / 2,
              y: this.targetBuilding.y - 20,
              alpha: 1,
              offsetY: 0
            });
            this.targetBuilding = null;
            
            // Get new coin after delay
            setTimeout(() => {
              this.hasCoin = true;
            }, 2000);
          } else {
            this.speedX = (dx / dist) * 1.5;
            this.speedY = (dy / dist) * 1.5;
          }
        } else if (!this.hasCoin) {
          // Random movement when no coin
          this.speedX += (Math.random() - 0.5) * 0.2;
          this.speedY += (Math.random() - 0.5) * 0.2;
          this.speedX = Math.max(-2, Math.min(2, this.speedX));
          this.speedY = Math.max(-2, Math.min(2, this.speedY));
        }

        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off edges
        if (this.x <= 0 || this.x >= canvas.width - this.width) {
          this.speedX *= -1;
          this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        }
        if (this.y <= 0 || this.y >= canvas.height - this.height) {
          this.speedY *= -1;
          this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        }
      }

      draw() {
        // Top-down view Santa
        // Body (red coat)
        ctx.fillStyle = '#c02425';
        ctx.fillRect(this.x + 2, this.y + 2, 12, 12);
        
        // Hat (white trim)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 4, this.y, 8, 3);
        
        // Hat top (red)
        ctx.fillStyle = '#c02425';
        ctx.fillRect(this.x + 5, this.y - 2, 6, 4);
        
        // Face/head
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(this.x + 5, this.y + 3, 6, 6);
        
        // Belt
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 2, this.y + 8, 12, 2);
        
        // Buckle
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.x + 6, this.y + 8, 4, 2);

        // Solana coin if carrying
        if (this.hasCoin) {
          // Coin circle
          ctx.fillStyle = '#14F195';
          ctx.beginPath();
          ctx.arc(this.x + 14, this.y - 5, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // SOL text
          ctx.fillStyle = '#000';
          ctx.font = '6px "Press Start 2P"';
          ctx.fillText('$', this.x + 11, this.y - 3);
        }

        // Name label (always show)
        const nameWidth = ctx.measureText(this.name).width + 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.x - (nameWidth / 2) + 8, this.y - 28, nameWidth, 14);
        ctx.fillStyle = '#ffd700';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText(this.name, this.x - (nameWidth / 2) + 12, this.y - 18);
      }
    }

    // Reindeer class
    class Reindeer {
      constructor() {
        this.x = Math.random() * (canvas.width - 40);
        this.y = Math.random() * (canvas.height - 40);
        this.width = 20;
        this.height = 16;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off edges
        if (this.x <= 0 || this.x >= canvas.width - this.width) {
          this.speedX *= -1;
          this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        }
        if (this.y <= 0 || this.y >= canvas.height - this.height) {
          this.speedY *= -1;
          this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        }

        // Random direction change
        if (Math.random() < 0.02) {
          this.speedX = (Math.random() - 0.5) * 1.5;
          this.speedY = (Math.random() - 0.5) * 1.5;
        }
      }

      draw() {
        // Reindeer body (brown)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 2, this.y + 4, 16, 10);
        
        // Head
        ctx.fillRect(this.x, this.y + 2, 6, 6);
        
        // Antlers
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y);
        ctx.lineTo(this.x + 2, this.y - 5);
        ctx.moveTo(this.x + 4, this.y);
        ctx.lineTo(this.x + 4, this.y - 4);
        ctx.stroke();
        
        // Red nose (Rudolph style)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - 1, this.y + 4, 3, 3);
        
        // Legs
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 4, this.y + 14, 2, 4);
        ctx.fillRect(this.x + 8, this.y + 14, 2, 4);
        ctx.fillRect(this.x + 12, this.y + 14, 2, 4);
        ctx.fillRect(this.x + 16, this.y + 14, 2, 4);
      }
    }

    // Create Santas
    const santas = [];
    for (let i = 0; i < 20; i++) {
      santas.push(new Santa(i));
    }
    setSantaCount(santas.length);

    // Create Reindeer
    const reindeer = [];
    for (let i = 0; i < 5; i++) {
      reindeer.push(new Reindeer());
    }

    // Draw building (top-down view)
    function drawBuilding(building) {
      // Roof (dark red top)
      ctx.fillStyle = building.roofColor;
      ctx.fillRect(building.x - 5, building.y - 5, building.width + 10, building.height + 10);
      
      // Main building body
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeRect(building.x, building.y, building.width, building.height);

      // Windows (top-down view - smaller squares)
      const windowSize = 12;
      const windowPadding = 20;
      const cols = Math.floor((building.width - windowPadding) / (windowSize + 15));
      const rows = Math.floor((building.height - windowPadding) / (windowSize + 15));
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const wx = building.x + windowPadding + col * (windowSize + 15);
          const wy = building.y + windowPadding + row * (windowSize + 15);
          
          // Random lit/unlit windows
          ctx.fillStyle = Math.random() > 0.4 ? '#ffd700' : '#654321';
          ctx.fillRect(wx, wy, windowSize, windowSize);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx, wy, windowSize, windowSize);
        }
      }

      // Door (centered at bottom)
      const doorWidth = 20;
      const doorHeight = 25;
      ctx.fillStyle = '#654321';
      ctx.fillRect(
        building.x + building.width / 2 - doorWidth / 2,
        building.y + building.height - doorHeight - 5,
        doorWidth,
        doorHeight
      );
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        building.x + building.width / 2 - doorWidth / 2,
        building.y + building.height - doorHeight - 5,
        doorWidth,
        doorHeight
      );
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

      // Background (snowy ground)
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Snow texture
      ctx.fillStyle = '#e8f4f8';
      for (let i = 0; i < 100; i++) {
        const x = (i * 157) % canvas.width;
        const y = (i * 239) % canvas.height;
        ctx.fillRect(x, y, 3, 3);
      }

      // Roads (darker paths)
      ctx.fillStyle = '#c8d8e4';
      // Horizontal roads
      ctx.fillRect(0, 280, canvas.width, 60);
      ctx.fillRect(0, 480, canvas.width, 60);
      // Vertical roads
      ctx.fillRect(500, 0, 60, canvas.height);
      ctx.fillRect(1000, 0, 60, canvas.height);

      // Road lines
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(0, 310);
      ctx.lineTo(canvas.width, 310);
      ctx.moveTo(0, 510);
      ctx.lineTo(canvas.width, 510);
      ctx.moveTo(530, 0);
      ctx.lineTo(530, canvas.height);
      ctx.moveTo(1030, 0);
      ctx.lineTo(1030, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw buildings
      buildings.forEach(building => drawBuilding(building));

      // Update and draw reindeer
      reindeer.forEach(deer => {
        deer.update();
        deer.draw();
      });

      // Trees and decorations
      ctx.fillStyle = '#228B22';
      const treePositions = [
        { x: 50, y: 50 }, { x: 600, y: 50 }, { x: 1100, y: 50 },
        { x: 150, y: 400 }, { x: 900, y: 400 }, { x: 1400, y: 400 },
        { x: 50, y: 650 }, { x: 600, y: 650 }, { x: 1450, y: 650 }
      ];
      treePositions.forEach(pos => {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y + 20);
        ctx.lineTo(pos.x - 15, pos.y + 35);
        ctx.lineTo(pos.x + 15, pos.y + 35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - 15, pos.y + 20);
        ctx.lineTo(pos.x + 15, pos.y + 20);
        ctx.closePath();
        ctx.fill();
      });

      // Update and draw Santas
      santas.forEach(santa => {
        santa.update();
        santa.draw();
      });

      // Draw coin notifications
      for (let i = coinNotifications.length - 1; i >= 0; i--) {
        const notif = coinNotifications[i];
        notif.offsetY -= 1;
        notif.alpha -= 0.02;
        
        if (notif.alpha <= 0) {
          coinNotifications.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = notif.alpha;
          ctx.fillStyle = '#14F195';
          ctx.font = 'bold 16px "Press Start 2P"';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText('+1', notif.x - 15, notif.y + notif.offsetY);
          ctx.fillText('+1', notif.x - 15, notif.y + notif.offsetY);
          ctx.restore();
        }
      }

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