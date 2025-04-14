document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const gameOverElement = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const restartButton = document.getElementById('restartButton');
    const bossTimerElement = document.getElementById('bossTimer');
    const bossTimerFill = document.querySelector('.timer-fill');
    const bossCountdown = document.querySelector('.boss-countdown');
    const bossAnnounce = document.getElementById('bossAnnounce');
    const bossNameElement = document.querySelector('.boss-name');
    const hitMessage = document.getElementById('hitMessage');

    // Dimensioni del canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Variabili di gioco
    let gameActive = false;
    let gameTime = 0;
    let lastTimestamp = 0;
    let difficulty = 1;
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    
    // Variabili boss
    const BOSS_SPAWN_TIME = 10000; // 10 secondi
    let bossTimer = 0;
    let bossActive = false;
    let currentBoss = null;
    let bossDefeated = 0;
    
    // Nuove variabili per le fasi del boss
    const BOSS_ATTACK_PHASE_DURATION = 8000; // 8 secondi di attacco
    const BOSS_VULNERABLE_PHASE_DURATION = 4000; // 4 secondi di vulnerabilità
    const BOSS_RECOVERY_PHASE_DURATION = 3000; // 3 secondi di recupero dopo essere colpito
    let bossPhaseTimer = 0;
    let bossPhase = 'attack'; // 'attack', 'vulnerable', 'recovery'
    let bossHitInVulnerablePhase = false;
    
    // Sistema bosses
    const bossList = [
        {
            name: "Prisma Frattale",
            color: "#00e2ff",
            size: 35,
            hp: 4,
            speed: 1.2,
            specialAbility: "refraction", // Rifrange in schemi geometrici
            geometryPoints: [],
            behaviorState: 'idle',
            pathAngle: 0,
            refractTimer: 0,
            currentPattern: null,
            behavior: function(deltaTime) {
                // Aggiorna il timer di rifrazione
                this.refractTimer = (this.refractTimer || 0) + deltaTime;
                
                if (bossPhase === 'vulnerable') {
                    // Durante la fase vulnerabile, forma un prisma geometrico stazionario
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    
                    // Movimento verso il centro
                    this.x += (centerX - this.x) * 0.1;
                    this.y += (centerY - this.y) * 0.1;
                    
                    // Prisma rotante durante la vulnerabilità
                    if (!this.geometryPoints.length) {
                        this.createGeometryPattern(6); // Esagono
                    }
                    
                    // Ruota i punti del prisma
                    this.rotateGeometryPoints(deltaTime * 0.001);
                    
                } else if (bossPhase === 'recovery') {
                    // Durante la fase di recupero, si frammenta temporaneamente
                    const fragmentsCount = 12;
                    const recoveryPulse = Math.sin(this.refractTimer * 0.005) * 0.3;
                    
                    // Crea frammenti se non esistono
                    if (!this.geometryPoints.length) {
                        this.createGeometryPattern(fragmentsCount, 1.5 + recoveryPulse);
                    } else {
                        // Espandi i frammenti
                        for (let i = 0; i < this.geometryPoints.length; i++) {
                            const point = this.geometryPoints[i];
                            const angle = (i / this.geometryPoints.length) * Math.PI * 2;
                            const expandFactor = 1.5 + recoveryPulse;
                            
                            point.distanceFactor = expandFactor;
                            point.x = this.x + Math.cos(angle + this.pathAngle) * this.size * expandFactor;
                            point.y = this.y + Math.sin(angle + this.pathAngle) * this.size * expandFactor;
                        }
                    }
                    
                    // Rotazione lenta durante il recupero
                    this.rotateGeometryPoints(deltaTime * 0.0005);
                    
                    // Emetti particelle dai frammenti
                    if (Math.random() < 0.2) {
                        const randomPoint = this.geometryPoints[Math.floor(Math.random() * this.geometryPoints.length)];
                        createParticle(randomPoint.x, randomPoint.y, this.color);
                    }
                    
                } else {
                    // Reset dei punti geometrici per il prossimo pattern
                    this.geometryPoints = [];
                    
                    // Durante la fase di attacco, cambia periodicamente pattern geometrico
                    this.stateTimer = (this.stateTimer || 0) + deltaTime;
                    
                    // Cambia stato comportamentale ogni 2.5 secondi
                    if (this.stateTimer > 2500) {
                        this.stateTimer = 0;
                        
                        // Seleziona un nuovo stato comportamentale
                        const states = ['triangle', 'square', 'spiral', 'zigzag'];
                        this.behaviorState = states[Math.floor(Math.random() * states.length)];
                        
                        // Effetto attivazione pattern
                        createExplosion(this.x, this.y, this.color, 15);
                    }
                    
                    // Comportamenti diversi in base allo stato attuale
                    switch (this.behaviorState) {
                        case 'triangle':
                            // Movimento triangolare intorno al giocatore
                            this.pathAngle += 0.002 * deltaTime;
                            
                            // Calcola i vertici del triangolo
                            const triangleRadius = 200;
                            const trianglePoints = [];
                            
                            for (let i = 0; i < 3; i++) {
                                const angle = this.pathAngle + (i * Math.PI * 2 / 3);
                                trianglePoints.push({
                                    x: player.x + Math.cos(angle) * triangleRadius,
                                    y: player.y + Math.sin(angle) * triangleRadius
                                });
                            }
                            
                            // Trova il punto più vicino lungo il percorso triangolare
                            let closestPoint = trianglePoints[0];
                            let minDist = Number.MAX_VALUE;
                            
                            for (const point of trianglePoints) {
                                const dx = this.x - point.x;
                                const dy = this.y - point.y;
                                const dist = dx * dx + dy * dy;
                                
                                if (dist < minDist) {
                                    minDist = dist;
                                    closestPoint = point;
                                }
                            }
                            
                            // Muoviti verso il punto successivo
                            const nextPointIndex = (trianglePoints.indexOf(closestPoint) + 1) % 3;
                            const nextPoint = trianglePoints[nextPointIndex];
                            
                            this.x += (nextPoint.x - this.x) * this.speed * 0.01;
                            this.y += (nextPoint.y - this.y) * this.speed * 0.01;
                            break;
                            
                        case 'square':
                            // Movimento a scatti in schemi quadrati
                            this.dashTimer = (this.dashTimer || 0) + deltaTime;
                            
                            if (!this.dashTarget || this.dashTimer > 800) {
                                this.dashTimer = 0;
                                
                                // Crea un nuovo punto target su uno schema quadrato
                                const squareRadius = 180;
                                const squareAngle = Math.floor(Math.random() * 4) * (Math.PI / 2);
                                
                                this.dashTarget = {
                                    x: player.x + Math.cos(squareAngle) * squareRadius,
                                    y: player.y + Math.sin(squareAngle) * squareRadius
                                };
                                
                                // Effetto di teletrasporto
                                createExplosion(this.x, this.y, this.color, 5);
                            }
                            
                            // Movimento rapido verso il target
                            const dashSpeed = 0.15;
                            this.x += (this.dashTarget.x - this.x) * dashSpeed;
                            this.y += (this.dashTarget.y - this.y) * dashSpeed;
                            break;
                            
                        case 'spiral':
                            // Movimento a spirale intorno al giocatore
                            this.spiralAngle = (this.spiralAngle || 0) + 0.003 * deltaTime;
                            this.spiralRadius = (this.spiralRadius || 250) - 0.1 * deltaTime;
                            
                            // Reset del raggio della spirale quando diventa troppo piccolo
                            if (this.spiralRadius < 100) {
                                this.spiralRadius = 250;
                            }
                            
                            // Calcola la posizione sulla spirale
                            this.x = player.x + Math.cos(this.spiralAngle) * this.spiralRadius;
                            this.y = player.y + Math.sin(this.spiralAngle) * this.spiralRadius;
                            break;
                            
                        case 'zigzag':
                            // Movimento a zigzag verso il giocatore
                            this.zigzagTimer = (this.zigzagTimer || 0) + deltaTime;
                            const zigzagPeriod = 1000;
                            
                            // Calcola direzione base verso il giocatore
                            const dx = player.x - this.x;
                            const dy = player.y - this.y;
                            const baseAngle = Math.atan2(dy, dx);
                            
                            // Aggiungi zigzag alla direzione base
                            const zigzagAmplitude = Math.PI / 3; // 60 gradi
                            const zigzagOffset = Math.sin(this.zigzagTimer / zigzagPeriod * Math.PI * 2) * zigzagAmplitude;
                            const moveAngle = baseAngle + zigzagOffset;
                            
                            // Applica movimento
                            this.x += Math.cos(moveAngle) * this.speed * 1.2;
                            this.y += Math.sin(moveAngle) * this.speed * 1.2;
                            break;
                            
                        default:
                            // Comportamento di fallback - movimento standard
                            const angle = Math.atan2(player.y - this.y, player.x - this.x);
                            this.x += Math.cos(angle) * this.speed;
                            this.y += Math.sin(angle) * this.speed;
                    }
                    
                    // Usa l'abilità speciale periodicamente durante la fase di attacco
                    if (this.refractTimer > 3000) {
                        this.useSpecialAbility();
                        this.refractTimer = 0;
                    }
                }
                
                // Aggiornamento scia
                if (this.trail.length > this.maxTrail) {
                    this.trail.shift();
                }
                this.trail.push({ x: this.x, y: this.y, size: this.size });
            },
            
            // Crea pattern geometrico di punti
            createGeometryPattern(numPoints, distanceFactor = 1.0) {
                this.geometryPoints = [];
                
                // Crea i punti in forma geometrica regolare
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const point = {
                        x: this.x + Math.cos(angle) * this.size * distanceFactor,
                        y: this.y + Math.sin(angle) * this.size * distanceFactor,
                        size: this.size / 3,
                        color: this.color,
                        angle: angle,
                        distanceFactor: distanceFactor
                    };
                    
                    this.geometryPoints.push(point);
                }
                
                return this.geometryPoints;
            },
            
            // Ruota i punti del pattern geometrico
            rotateGeometryPoints(angleIncrement) {
                if (!this.geometryPoints.length) return;
                
                this.pathAngle = (this.pathAngle || 0) + angleIncrement;
                
                for (let i = 0; i < this.geometryPoints.length; i++) {
                    const point = this.geometryPoints[i];
                    const angle = (i / this.geometryPoints.length) * Math.PI * 2 + this.pathAngle;
                    
                    point.x = this.x + Math.cos(angle) * this.size * point.distanceFactor;
                    point.y = this.y + Math.sin(angle) * this.size * point.distanceFactor;
                }
            },
            
            useSpecialAbility: function() {
                if (bossPhase === 'attack') {
                    // Crea un prisma refrattivo che genera raggi
                    
                    // Determina il tipo di pattern
                    const patterns = [
                        { shape: 'line', count: 12 }, // Raggi in tutte le direzioni
                        { shape: 'grid', count: 16 }, // Griglia 4x4 di raggi
                        { shape: 'spiral', count: 8 }  // Spirale di raggi
                    ];
                    
                    this.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
                    
                    // Crea i punti del pattern
                    const laserPoints = [];
                    
                    if (this.currentPattern.shape === 'line') {
                        // Raggi lineari in tutte le direzioni
                        for (let i = 0; i < this.currentPattern.count; i++) {
                            const angle = (i / this.currentPattern.count) * Math.PI * 2;
                            const distance = 500; // Lunghezza del raggio
                            
                            // Punto iniziale (vicino al boss)
                            laserPoints.push({
                                x: this.x + Math.cos(angle) * this.size,
                                y: this.y + Math.sin(angle) * this.size
                            });
                            
                            // Punto finale (lontano dal boss)
                            laserPoints.push({
                                x: this.x + Math.cos(angle) * distance,
                                y: this.y + Math.sin(angle) * distance
                            });
                        }
                    } else if (this.currentPattern.shape === 'grid') {
                        // Griglia di raggi
                        const gridSize = Math.sqrt(this.currentPattern.count);
                        const spacing = 100;
                        
                        for (let i = 0; i < gridSize; i++) {
                            for (let j = 0; j < gridSize; j++) {
                                // Calcola posizione nella griglia
                                const gridX = this.x + (i - gridSize/2 + 0.5) * spacing;
                                const gridY = this.y + (j - gridSize/2 + 0.5) * spacing;
                                
                                // Aggiungi raggio dal boss al punto della griglia
                                laserPoints.push({ x: this.x, y: this.y });
                                laserPoints.push({ x: gridX, y: gridY });
                            }
                        }
                    } else if (this.currentPattern.shape === 'spiral') {
                        // Spirale di raggi
                        const baseAngle = Math.random() * Math.PI;
                        
                        for (let i = 0; i < this.currentPattern.count; i++) {
                            const angle = baseAngle + (i / this.currentPattern.count) * Math.PI * 4;
                            const distance = 50 + i * 30; // Aumenta la distanza ad ogni iterazione
                            
                            // Punto iniziale e finale della spirale
                            laserPoints.push({ x: this.x, y: this.y });
                            laserPoints.push({
                                x: this.x + Math.cos(angle) * distance,
                                y: this.y + Math.sin(angle) * distance
                            });
                        }
                    }
                    
                    // Crea temporaneamente i laser - verranno visualizzati nel metodo draw
                    this.laserPoints = laserPoints;
                    
                    // Effetto visivo per l'attivazione dell'abilità
                    createExplosion(this.x, this.y, this.color, 30);
                    
                    // Genera particelle dannose lungo i raggi
                    for (let i = 0; i < laserPoints.length; i += 2) {
                        const start = laserPoints[i];
                        const end = laserPoints[i + 1];
                        
                        // Calcola direzione e lunghezza
                        const dx = end.x - start.x;
                        const dy = end.y - start.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        // Crea particelle lungo il raggio
                        const particleCount = Math.floor(dist / 30);
                        for (let j = 0; j < particleCount; j++) {
                            const ratio = j / particleCount;
                            const particleX = start.x + dx * ratio;
                            const particleY = start.y + dy * ratio;
                            
                            // Crea particella dannosa
                            const particle = {
                                x: particleX,
                                y: particleY,
                                size: 5,
                                speed: 0.2,
                                angle: Math.atan2(dy, dx) + (Math.random() * 0.5 - 0.25),
                                color: this.color,
                                life: 1.5,
                                decay: 0.01,
                                isDamaging: true  // Questa particella danneggia il giocatore
                            };
                            particles.push(particle);
                        }
                    }
                    
                    // Rimuovi i laser dopo 1 secondo
                    setTimeout(() => {
                        this.laserPoints = null;
                    }, 1000);
                    
                    // Effetto glitch quando si attiva l'abilità
                    glitchEffect();
                }
            },
            
            draw() {
                // Disegno scia
                this.trail.forEach((pos, index) => {
                    const alpha = index / this.maxTrail;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, pos.size * alpha, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color.replace(/[^\d,]/g, '')}, ${alpha * 0.4})`;
                    ctx.fill();
                });
                
                // Colore diverso in base alla fase
                if (bossPhase === 'vulnerable') {
                    this.color = this.vulnerableColor;
                } else {
                    this.color = this.normalColor;
                }
                
                // Disegna laser speciali se attivi
                if (this.laserPoints && this.laserPoints.length >= 2) {
                    for (let i = 0; i < this.laserPoints.length; i += 2) {
                        const start = this.laserPoints[i];
                        const end = this.laserPoints[i + 1];
                        
                        // Disegna il laser con effetto glow
                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 3;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 10;
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0;
                }
                
                // Disegna il centro prismatico
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                
                // Crea un gradiente radiale per l'effetto prisma
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, this.size * 0.3,
                    this.x, this.y, this.size
                );
                gradient.addColorStop(0, "#ffffff");
                gradient.addColorStop(0.5, this.color);
                gradient.addColorStop(0.7, "#ffffff");
                gradient.addColorStop(1, this.color);
                
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Effetto glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Disegna i punti geometrici
                this.geometryPoints.forEach(point => {
                    // Disegna punto
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Effetto glow
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.color;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, point.size * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = "#ffffff";
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Linea di connessione al corpo principale
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(point.x, point.y);
                    ctx.strokeStyle = `${this.color}80`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
                
                // Disegna barra della vita
                const healthBarWidth = this.size * 2;
                const healthBarHeight = 6;
                const healthPercentage = this.hp / bossTemplate.hp;
                
                // Sfondo barra della vita
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth, healthBarHeight);
                
                // Barra della vita
                ctx.fillStyle = this.normalColor;
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth * healthPercentage, healthBarHeight);
            },
            
            damage() {
                this.hp -= 1;
                createExplosion(this.x, this.y, this.color, 30);
                
                // Effetto prisma quando viene colpito
                this.createGeometryPattern(8, 1.5);
                glitchEffect();
                
                // Controllo se è stato sconfitto
                if (this.hp <= 0) {
                    defeatBoss();
                } else {
                    // Passa alla fase di recupero
                    bossPhase = 'recovery';
                    bossPhaseTimer = 0;
                    hitMessage.classList.add('hidden');
                }
            },
            
            // Verifica collisione con qualsiasi parte del boss
            checkPartCollision(entity) {
                // Controlla prima il corpo principale
                const dx = entity.x - this.x;
                const dy = entity.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < entity.size + this.size) {
                    return true;
                }
                
                // Poi controlla tutti i punti geometrici
                for (const point of this.geometryPoints) {
                    const pointDx = entity.x - point.x;
                    const pointDy = entity.y - point.y;
                    const pointDistance = Math.sqrt(pointDx * pointDx + pointDy * pointDy);
                    
                    if (pointDistance < entity.size + point.size) {
                        return true;
                    }
                }
                
                return false;
            }
        },
        {
            name: "Vortice Ipnotico",
            color: "#9900ff",
            size: 30,
            hp: 4,
            speed: 1.2,
            specialAbility: "warp", // Distorce lo spazio e si teletrasporta
            behavior: function(deltaTime) {
                if (bossPhase === 'vulnerable') {
                    // Durante la fase vulnerabile, va al centro dello schermo
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    this.x += (centerX - this.x) * 0.1;
                    this.y += (centerY - this.y) * 0.1;
                    this.warping = false;
                } else if (bossPhase === 'recovery') {
                    // Durante la fase di recupero, si allontana leggermente
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const angle = Math.atan2(dy, dx);
                    this.x -= Math.cos(angle) * this.speed * 0.5;
                    this.y -= Math.sin(angle) * this.speed * 0.5;
                } else {
                    // Accumula tempo per il teletrasporto
                    this.warpTimer = (this.warpTimer || 0) + deltaTime;
                    
                    // Rotazione attorno al giocatore
                    const distanceFromPlayer = 200;
                    const rotationSpeed = 0.002;
                    
                    // Se non è in fase di teletrasporto
                    if (!this.warping) {
                        this.angle = (this.angle || 0) + rotationSpeed * deltaTime;
                        this.x = player.x + Math.cos(this.angle) * distanceFromPlayer;
                        this.y = player.y + Math.sin(this.angle) * distanceFromPlayer;
                        
                        // Teletrasporto periodico
                        if (this.warpTimer > 2000) {
                            this.useSpecialAbility();
                            this.warpTimer = 0;
                        }
                    } else {
                        // Durante il teletrasporto, il boss è invisibile e non si muove
                        this.warpTime -= deltaTime;
                        if (this.warpTime <= 0) {
                            this.warping = false;
                            this.x = player.x + (Math.random() * 400 - 200);
                            this.y = player.y + (Math.random() * 400 - 200);
                            createExplosion(this.x, this.y, this.color, 20);
                        }
                    }
                }
                
                // Aggiornamento scia solo se non in fase di warp
                if (!this.warping) {
                    if (this.trail.length > this.maxTrail) {
                        this.trail.shift();
                    }
                    this.trail.push({ x: this.x, y: this.y, size: this.size });
                }
            },
            useSpecialAbility: function() {
                // Diventa invisibile e si teletrasporta
                if (bossPhase === 'attack') {
                    this.warping = true;
                    this.warpTime = 1000;
                    createExplosion(this.x, this.y, this.color, 20);
                    
                    // Effetto glitch durante il teletrasporto
                    glitchEffect();
                }
            }
        },
        {
            name: "Nebula Vorticosa",
            color: "#e610e6",
            size: 40,
            hp: 4,
            speed: 1.1,
            specialAbility: "gravityWell", // Crea zone di gravità che attraggono o respingono
            orbitAngle: 0,
            gravityWells: [],
            behavior: function(deltaTime) {
                if (bossPhase === 'vulnerable') {
                    // Durante la fase vulnerabile, si ferma e pulsa
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    this.x += (centerX - this.x) * 0.1;
                    this.y += (centerY - this.y) * 0.1;
                    
                    // Disattiva i pozzi gravitazionali
                    this.gravityWells = [];
                    
                } else if (bossPhase === 'recovery') {
                    // Durante la fase di recupero, si trasforma in una nebulosa espansa
                    this.recoveryTime = (this.recoveryTime || 0) + deltaTime;
                    const pulseSize = Math.sin(this.recoveryTime * 0.005) * 0.3;
                    this.currentSize = this.size * (1 + pulseSize);
                    
                    // Emetti particelle in tutte le direzioni
                    if (Math.random() < 0.3) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = this.size * 1.2;
                        createParticle(
                            this.x + Math.cos(angle) * distance,
                            this.y + Math.sin(angle) * distance,
                            this.color
                        );
                    }
                    
                } else {
                    // Reset size
                    this.currentSize = this.size;
                    
                    // Movimento: alternanza tra fase di stasi e scatti rapidi
                    this.movementPhase = (this.movementPhase || 'stasis');
                    this.phaseTimer = (this.phaseTimer || 0) + deltaTime;
                    
                    if (this.movementPhase === 'stasis') {
                        // In stasi, rimane quasi fermo e ruota lentamente
                        this.orbitAngle += 0.001 * deltaTime;
                        
                        if (this.phaseTimer > 2000) {
                            // Passa alla fase di scatto
                            this.movementPhase = 'dash';
                            this.phaseTimer = 0;
                            this.dashTarget = {
                                x: player.x + (Math.random() * 400 - 200),
                                y: player.y + (Math.random() * 400 - 200)
                            };
                            
                            // Mantieni il punto di dash all'interno dello schermo
                            this.dashTarget.x = Math.max(100, Math.min(canvas.width - 100, this.dashTarget.x));
                            this.dashTarget.y = Math.max(100, Math.min(canvas.height - 100, this.dashTarget.y));
                        }
                    } else if (this.movementPhase === 'dash') {
                        // Scatto rapido verso il punto target
                        const dashSpeed = 0.2;
                        this.x += (this.dashTarget.x - this.x) * dashSpeed;
                        this.y += (this.dashTarget.y - this.y) * dashSpeed;
                        
                        // Rilascia particelle durante lo scatto
                        if (Math.random() < 0.3) {
                            createParticle(this.x, this.y, this.color);
                        }
                        
                        // Calcola la distanza al target
                        const dx = this.dashTarget.x - this.x;
                        const dy = this.dashTarget.y - this.y;
                        const distToTarget = Math.sqrt(dx * dx + dy * dy);
                        
                        // Se è arrivato al target o è passato abbastanza tempo
                        if (distToTarget < 20 || this.phaseTimer > 1000) {
                            this.movementPhase = 'stasis';
                            this.phaseTimer = 0;
                        }
                    }
                    
                    // Uso periodico dell'abilità speciale
                    this.abilityTimer = (this.abilityTimer || 0) + deltaTime;
                    if (this.abilityTimer > 3000 && this.gravityWells.length < 3) {
                        this.useSpecialAbility();
                        this.abilityTimer = 0;
                    }
                    
                    // Aggiorna i pozzi gravitazionali
                    this.updateGravityWells(deltaTime);
                }
                
                // Aggiornamento scia
                if (this.trail.length > this.maxTrail) {
                    this.trail.shift();
                }
                this.trail.push({ x: this.x, y: this.y, size: this.currentSize || this.size });
            },
            
            // Aggiornamento dei pozzi gravitazionali
            updateGravityWells(deltaTime) {
                for (let i = this.gravityWells.length - 1; i >= 0; i--) {
                    const well = this.gravityWells[i];
                    
                    // Aggiorna durata
                    well.life -= deltaTime * 0.0005;
                    
                    // Rimuovi pozzi esauriti
                    if (well.life <= 0) {
                        this.gravityWells.splice(i, 1);
                        createExplosion(well.x, well.y, well.type === 'attract' ? '#ff00ff' : '#00ffff', 15);
                        continue;
                    }
                    
                    // Pulsa il raggio del pozzo
                    well.currentRadius = well.radius * (0.8 + Math.sin(gameTime * 0.003) * 0.2);
                    
                    // Applica effetto gravitazionale sul giocatore
                    const dx = player.x - well.x;
                    const dy = player.y - well.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);
                    
                    // Applica forza solo se il giocatore è nel raggio
                    if (dist < well.currentRadius * 1.5) {
                        // Calcola l'intensità della forza (più forte quando vicino)
                        const force = 0.4 * (1 - dist / (well.currentRadius * 1.5));
                        
                        // Direzione della forza
                        let dirX = dx / dist;
                        let dirY = dy / dist;
                        
                        // Se repulsivo, inverte la direzione
                        if (well.type === 'repel') {
                            dirX *= -1;
                            dirY *= -1;
                        }
                        
                        // Applica movimento al giocatore
                        player.x += dirX * force;
                        player.y += dirY * force;
                        
                        // Crea particelle dall'effetto gravitazionale
                        if (Math.random() < 0.1) {
                            createParticle(
                                well.x + dirX * well.currentRadius * Math.random(),
                                well.y + dirY * well.currentRadius * Math.random(),
                                well.type === 'attract' ? '#ff00ff' : '#00ffff'
                            );
                        }
                        
                        // Verifica collisione con il centro del pozzo
                        if (dist < player.size + 15) {
                            if (well.type === 'attract') {
                                // Pozzi attrattivi danneggiano il giocatore
                                gameOver();
                            }
                        }
                    }
                }
            },
            
            useSpecialAbility: function() {
                if (bossPhase === 'attack') {
                    // Crea un nuovo pozzo gravitazionale
                    const isAttractive = Math.random() < 0.7; // 70% attrattivo, 30% repulsivo
                    
                    // Posiziona il pozzo in maniera strategica
                    let wellX, wellY;
                    
                    if (isAttractive) {
                        // Pozzi attrattivi vengono posizionati vicino al giocatore
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 150 + Math.random() * 100;
                        wellX = player.x + Math.cos(angle) * distance;
                        wellY = player.y + Math.sin(angle) * distance;
                    } else {
                        // Pozzi repulsivi vengono posizionati tra il giocatore e il boss
                        wellX = (player.x + this.x) / 2 + (Math.random() * 100 - 50);
                        wellY = (player.y + this.y) / 2 + (Math.random() * 100 - 50);
                    }
                    
                    // Assicura che il pozzo sia dentro lo schermo
                    wellX = Math.max(50, Math.min(canvas.width - 50, wellX));
                    wellY = Math.max(50, Math.min(canvas.height - 50, wellY));
                    
                    // Crea il pozzo
                    const well = {
                        x: wellX,
                        y: wellY,
                        radius: 80 + Math.random() * 40,
                        type: isAttractive ? 'attract' : 'repel',
                        life: 1.0
                    };
                    
                    this.gravityWells.push(well);
                    
                    // Effetto visivo
                    createExplosion(well.x, well.y, isAttractive ? '#ff00ff' : '#00ffff', 20);
                    glitchEffect();
                }
            },
            
            draw() {
                // Disegno scia
                this.trail.forEach((pos, index) => {
                    const alpha = index / this.maxTrail;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, pos.size * alpha, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color.replace(/[^\d,]/g, '')}, ${alpha * 0.4})`;
                    ctx.fill();
                });
                
                // Colore diverso in base alla fase
                if (bossPhase === 'vulnerable') {
                    this.color = this.vulnerableColor;
                } else {
                    this.color = this.normalColor;
                }
                
                // Disegna pozzi gravitazionali
                this.gravityWells.forEach(well => {
                    const wellColor = well.type === 'attract' ? '#ff00ff' : '#00ffff';
                    
                    // Cerchio esterno pulsante
                    ctx.beginPath();
                    ctx.arc(well.x, well.y, well.currentRadius, 0, Math.PI * 2);
                    
                    // Gradiente radiale che sfuma verso l'esterno
                    const gradient = ctx.createRadialGradient(
                        well.x, well.y, 0,
                        well.x, well.y, well.currentRadius
                    );
                    gradient.addColorStop(0, `${wellColor}80`); // Semi-trasparente al centro
                    gradient.addColorStop(1, `${wellColor}00`); // Completamente trasparente ai bordi
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    // Linee orbitali che girano intorno al pozzo
                    const numLines = 8;
                    const rotationSpeed = well.type === 'attract' ? 0.001 : -0.001;
                    const rotationOffset = gameTime * rotationSpeed;
                    
                    for (let i = 0; i < numLines; i++) {
                        const angle = (i / numLines) * Math.PI * 2 + rotationOffset;
                        const innerRadius = well.currentRadius * 0.2;
                        const outerRadius = well.currentRadius * 0.9;
                        
                        ctx.beginPath();
                        ctx.moveTo(
                            well.x + Math.cos(angle) * innerRadius,
                            well.y + Math.sin(angle) * innerRadius
                        );
                        ctx.lineTo(
                            well.x + Math.cos(angle) * outerRadius,
                            well.y + Math.sin(angle) * outerRadius
                        );
                        ctx.strokeStyle = `${wellColor}${Math.floor(well.life * 255).toString(16).padStart(2, '0')}`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    
                    // Nucleo centrale del pozzo
                    ctx.beginPath();
                    ctx.arc(well.x, well.y, 15, 0, Math.PI * 2);
                    ctx.fillStyle = wellColor;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = wellColor;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
                
                // Disegno boss con effetto nebulosa
                const bossSize = this.currentSize || this.size;
                
                // Nebulosa esterna
                const numLayers = 4;
                for (let i = 0; i < numLayers; i++) {
                    const layerSize = bossSize * (1 - i * 0.15);
                    const alpha = 0.3 - i * 0.05;
                    
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, layerSize, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color.replace(/[^\d,]/g, '')}, ${alpha})`;
                    ctx.fill();
                }
                
                // Nucleo centrale (più luminoso)
                ctx.beginPath();
                ctx.arc(this.x, this.y, bossSize * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Effetto glow
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, bossSize * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Anelli orbitali rotanti (solo in fase di attacco)
                if (bossPhase === 'attack') {
                    const numRings = 2;
                    for (let i = 0; i < numRings; i++) {
                        const ringSize = bossSize * (1.2 + i * 0.3);
                        const ringRotation = (gameTime * 0.001 * (i % 2 === 0 ? 1 : -1));
                        
                        ctx.beginPath();
                        ctx.ellipse(
                            this.x, this.y,
                            ringSize, ringSize * 0.6,
                            ringRotation, 0, Math.PI * 2
                        );
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 15]);
                        ctx.stroke();
                    }
                    ctx.setLineDash([]);
                }
                
                // Disegna barra della vita
                const healthBarWidth = this.size * 2;
                const healthBarHeight = 6;
                const healthPercentage = this.hp / bossTemplate.hp;
                
                // Sfondo barra della vita
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth, healthBarHeight);
                
                // Barra della vita
                ctx.fillStyle = this.normalColor;
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth * healthPercentage, healthBarHeight);
            }
        }
    ];
    
    // Pollice Cosmico (il giocatore)
    const player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 20,
        color: '#00ffff',
        trail: [],
        maxTrail: 20,
        update(deltaTime) {
            // Movimento fluido verso la posizione del mouse (con easing)
            this.x += (mouseX - this.x) * 0.1;
            this.y += (mouseY - this.y) * 0.1;
            
            // Aggiunta posizione alla scia
            if (this.trail.length > this.maxTrail) {
                this.trail.shift();
            }
            this.trail.push({ x: this.x, y: this.y, size: this.size });
        },
        draw() {
            // Disegno scia
            this.trail.forEach((pos, index) => {
                const alpha = index / this.maxTrail;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, pos.size * alpha, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
                ctx.fill();
            });
            
            // Disegno pollice
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // Effetto glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        },
        checkCollision(entity) {
            const dx = this.x - entity.x;
            const dy = this.y - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < this.size + entity.size;
        }
    };

    // Pollici Fantasma (nemici)
    const enemies = [];
    const maxEnemies = 10;

    function createEnemy() {
        // Posizione casuale fuori dallo schermo
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? -50 : canvas.width + 50;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() > 0.5 ? -50 : canvas.height + 50;
        }

        const colors = ['#ff00ff', '#ff0066', '#9900ff', '#00ff99'];
        
        return {
            x,
            y,
            size: 15 + Math.random() * 10,
            speed: 1 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            targetX: 0,
            targetY: 0,
            trail: [],
            maxTrail: 15,
            changeTargetTimer: 0,
            changeTargetInterval: 1000 + Math.random() * 2000,
            update(deltaTime) {
                // Aggiornamento timer per cambio bersaglio
                this.changeTargetTimer += deltaTime;
                if (this.changeTargetTimer > this.changeTargetInterval) {
                    // Punta verso il giocatore con una deviazione casuale
                    this.targetX = player.x + (Math.random() * 200 - 100);
                    this.targetY = player.y + (Math.random() * 200 - 100);
                    this.changeTargetTimer = 0;
                }
                
                // Movimento verso il bersaglio
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const angle = Math.atan2(dy, dx);
                
                const speedFactor = Math.min(difficulty, 3);
                this.x += Math.cos(angle) * this.speed * speedFactor;
                this.y += Math.sin(angle) * this.speed * speedFactor;
                
                // Aggiunta posizione alla scia
                if (this.trail.length > this.maxTrail) {
                    this.trail.shift();
                }
                this.trail.push({ x: this.x, y: this.y, size: this.size });
            },
            draw() {
                // Disegno scia
                this.trail.forEach((pos, index) => {
                    const alpha = index / this.maxTrail;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, pos.size * alpha, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color.replace(/[^\d,]/g, '')}, ${alpha * 0.3})`;
                    ctx.fill();
                });
                
                // Disegno nemico
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Effetto glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        };
    }

    // Nodi della rete
    const nodes = [];
    const maxNodes = 50;
    const connections = [];

    function createNode() {
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff99'];
        
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 3 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            pulseSpeed: 0.5 + Math.random() * 2,
            pulseSize: 0,
            maxPulse: 1 + Math.random(),
            connected: []
        };
    }

    function createConnections() {
        connections.length = 0;
        
        nodes.forEach((node, i) => {
            node.connected = [];
            // Connetti ogni nodo con alcuni altri nodi vicini
            for (let j = 0; j < nodes.length; j++) {
                if (i !== j) {
                    const dx = node.x - nodes[j].x;
                    const dy = node.y - nodes[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 200) {
                        node.connected.push(j);
                        connections.push({
                            from: i,
                            to: j,
                            active: true,
                            alpha: 0.5 + Math.random() * 0.5
                        });
                    }
                }
            }
        });
    }

    // Particelle ed effetti
    const particles = [];
    
    function createParticle(x, y, color) {
        particles.push({
            x,
            y,
            size: 2 + Math.random() * 5,
            speed: 1 + Math.random() * 3,
            angle: Math.random() * Math.PI * 2,
            color,
            life: 1,
            decay: 0.01 + Math.random() * 0.03
        });
    }

    function createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            createParticle(x, y, color);
        }
    }

    // Crea un boss
    function createBoss() {
        // Scegli un boss casuale dalla lista
        const bossTemplate = bossList[Math.floor(Math.random() * bossList.length)];
        
        // Posizione fuori dallo schermo
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? -100 : canvas.width + 100;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() > 0.5 ? -100 : canvas.height + 100;
        }
        
        // Crea il boss con le proprietà del template
        const boss = {
            ...bossTemplate,
            x,
            y,
            trail: [],
            maxTrail: 25,
            hasDivided: false,
            vulnerableColor: "#ff0000", // Colore quando vulnerabile
            normalColor: bossTemplate.color, // Salva il colore originale
            update(deltaTime) {
                // Usa il comportamento specifico del boss
                this.behavior(deltaTime);
            },
            draw() {
                // Disegno scia
                this.trail.forEach((pos, index) => {
                    const alpha = index / this.maxTrail;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, pos.size * alpha, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color.replace(/[^\d,]/g, '')}, ${alpha * 0.4})`;
                    ctx.fill();
                });
                
                // Colore diverso in base alla fase
                if (bossPhase === 'vulnerable') {
                    this.color = this.vulnerableColor;
                } else {
                    this.color = this.normalColor;
                }
                
                // Disegno boss
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Effetto glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Disegna barra della vita
                const healthBarWidth = this.size * 2;
                const healthBarHeight = 6;
                const healthPercentage = this.hp / bossTemplate.hp;
                
                // Sfondo barra della vita
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth, healthBarHeight);
                
                // Barra della vita
                ctx.fillStyle = this.normalColor;
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth * healthPercentage, healthBarHeight);
                
                ctx.shadowBlur = 0;
            },
            damage() {
                this.hp -= 1;
                createExplosion(this.x, this.y, this.color, 30);
                
                // Effetto glitch quando viene colpito
                glitchEffect();
                
                // Controllo se è stato sconfitto
                if (this.hp <= 0) {
                    defeatBoss();
                } else {
                    // Passa alla fase di recupero
                    bossPhase = 'recovery';
                    bossPhaseTimer = 0;
                    hitMessage.classList.add('hidden');
                }
            }
        };
        
        return boss;
    }
    
    // Spawn di un boss
    function spawnBoss() {
        // Rimuovi tutti i nemici esistenti
        enemies.length = 0;
        
        // Crea un nuovo boss
        currentBoss = createBoss();
        bossActive = true;
        
        // Inizia con la fase di attacco
        bossPhase = 'attack';
        bossPhaseTimer = 0;
        
        // Mostra l'annuncio del boss
        bossNameElement.textContent = currentBoss.name;
        bossAnnounce.classList.remove('hidden');
        
        // Nascondi l'annuncio dopo 3 secondi
        setTimeout(() => {
            bossAnnounce.classList.add('hidden');
        }, 3000);
        
        // Effetto glitch per lo spawn del boss
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                glitchEffect();
            }, i * 200);
        }
    }
    
    // Quando un boss viene sconfitto
    function defeatBoss() {
        // Grande esplosione
        createExplosion(currentBoss.x, currentBoss.y, currentBoss.color, 100);
        
        // Effetti glitch multipli
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                glitchEffect();
            }, i * 100);
        }
        
        // Incrementa contatore boss sconfitti
        bossDefeated++;
        
        // Reset timer boss e stato
        bossActive = false;
        currentBoss = null;
        bossTimer = 0;
        bossPhase = 'attack';
        hitMessage.classList.add('hidden');
        
        // Incrementa difficoltà
        difficulty += 0.5;
    }

    // Gestione delle fasi del boss
    function updateBossPhases(deltaTime) {
        if (!bossActive || !currentBoss) return;
        
        bossPhaseTimer += deltaTime;
        
        // Gestione delle transizioni di fase
        if (bossPhase === 'attack' && bossPhaseTimer >= BOSS_ATTACK_PHASE_DURATION) {
            // Transizione alla fase vulnerabile
            bossPhase = 'vulnerable';
            bossPhaseTimer = 0;
            hitMessage.classList.remove('hidden');
            // Effetto glitch per la transizione
            glitchEffect();
        } else if (bossPhase === 'vulnerable' && bossPhaseTimer >= BOSS_VULNERABLE_PHASE_DURATION) {
            // Se il boss non è stato colpito durante la fase vulnerabile, torna ad attaccare
            if (!bossHitInVulnerablePhase) {
                bossPhase = 'attack';
                bossPhaseTimer = 0;
                hitMessage.classList.add('hidden');
            }
            bossHitInVulnerablePhase = false;
        } else if (bossPhase === 'recovery' && bossPhaseTimer >= BOSS_RECOVERY_PHASE_DURATION) {
            // Dopo la fase di recupero, torna ad attaccare
            bossPhase = 'attack';
            bossPhaseTimer = 0;
        }
    }

    // Inizializzazione
    function initGame() {
        gameActive = true;
        gameTime = 0;
        bossTimer = 0;
        bossActive = false;
        currentBoss = null;
        bossDefeated = 0;
        difficulty = 1;
        bossPhase = 'attack';
        bossPhaseTimer = 0;
        
        // Reset arrays
        enemies.length = 0;
        nodes.length = 0;
        connections.length = 0;
        particles.length = 0;
        
        // Crea nodi della rete
        for (let i = 0; i < maxNodes; i++) {
            nodes.push(createNode());
        }
        
        // Crea connessioni
        createConnections();
        
        // Crea nemici iniziali
        for (let i = 0; i < 3; i++) {
            enemies.push(createEnemy());
        }
        
        // Nascondi game over, annuncio boss e messaggio HIT IT
        gameOverElement.classList.add('hidden');
        bossAnnounce.classList.add('hidden');
        hitMessage.classList.add('hidden');
        
        // Reset timer boss UI
        updateBossTimerUI(0);
    }
    
    // Aggiorna l'UI del timer del boss
    function updateBossTimerUI(percentage) {
        bossTimerFill.style.height = `${percentage}%`;
        
        // Aggiorna il countdown in secondi
        const remainingSeconds = Math.ceil((BOSS_SPAWN_TIME - bossTimer) / 1000);
        bossCountdown.textContent = `${remainingSeconds}s`;
    }

    // Game loop
    function gameLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        if (!gameActive) return;
        
        // Incrementa timer di gioco
        gameTime += deltaTime;
        const seconds = Math.floor(gameTime / 1000);
        scoreElement.textContent = `Tempo: ${seconds}`;
        
        // Incrementa difficoltà
        if (!bossActive) {
            difficulty = 1 + Math.min(seconds / 30, 4);
        }
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Aggiorna timer boss se non c'è un boss attivo
        if (!bossActive) {
            bossTimer += deltaTime;
            const percentage = (bossTimer / BOSS_SPAWN_TIME) * 100;
            updateBossTimerUI(percentage);
            
            // Spawn boss quando il timer raggiunge il tempo previsto
            if (bossTimer >= BOSS_SPAWN_TIME) {
                spawnBoss();
            }
        } else {
            // Aggiorna le fasi del boss
            updateBossPhases(deltaTime);
        }
        
        // Aggiorna e disegna nodi
        nodes.forEach((node, index) => {
            // Fai "pulsare" i nodi
            node.pulseSize += node.pulseSpeed * 0.01;
            if (node.pulseSize > node.maxPulse) {
                node.pulseSize = 0;
            }
            
            // Disegna nodo
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size * (1 + node.pulseSize), 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Disegna connessioni
            node.connected.forEach(connectedIdx => {
                const connectedNode = nodes[connectedIdx];
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(connectedNode.x, connectedNode.y);
                ctx.strokeStyle = `rgba(${node.color.replace(/[^\d,]/g, '')}, ${0.2 + (Math.sin(gameTime * 0.001) + 1) * 0.2})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });
        
        // Aggiorna e disegna particelle
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                particles.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${particle.color.replace(/[^\d,]/g, '')}, ${particle.life})`;
                ctx.fill();
                
                // Verifica collisione con le particelle dannose
                if (particle.isDamaging) {
                    const dx = player.x - particle.x;
                    const dy = player.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < player.size + particle.size * particle.life) {
                        gameOver();
                    }
                }
            }
        }
        
        // Se c'è un boss attivo, aggiornalo e disegnalo
        if (bossActive && currentBoss) {
            currentBoss.update(deltaTime);
            currentBoss.draw();
            
            // Gestisci la collisione con il boss in base alla fase
            if (player.checkCollision(currentBoss)) {
                if (bossPhase === 'vulnerable') {
                    // Danneggia il boss solo durante la fase vulnerabile
                    currentBoss.damage();
                    bossHitInVulnerablePhase = true;
                } else if (bossPhase === 'attack') {
                    // Game over se colpisce il boss durante la fase di attacco
                    gameOver();
                }
                // Durante la fase di recupero non succede nulla
            } 
            // Gestione speciale per Doppio Pollice e le sue parti
            else if (currentBoss.name === "Doppio Pollice" && bossPhase === 'vulnerable' && currentBoss.parts.length > 0) {
                // Controlla la collisione con le parti quando è in fase vulnerabile
                let partHit = false;
                
                // Verifica collisione con ogni parte
                for (let i = 0; i < currentBoss.parts.length; i++) {
                    const part = currentBoss.parts[i];
                    const dx = player.x - part.x;
                    const dy = player.y - part.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < player.size + part.size) {
                        // Colpito una parte
                        partHit = true;
                        break;
                    }
                }
                
                if (partHit) {
                    // Danneggia il boss se colpisce una parte qualsiasi
                    currentBoss.damage();
                    bossHitInVulnerablePhase = true;
                }
            }
            // Controlla collisioni con le parti durante la fase di attacco
            else if (currentBoss.name === "Doppio Pollice" && bossPhase === 'attack') {
                for (let i = 0; i < currentBoss.parts.length; i++) {
                    const part = currentBoss.parts[i];
                    const dx = player.x - part.x;
                    const dy = player.y - part.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < player.size + part.size) {
                        // Game over se colpisce una parte durante l'attacco
                        gameOver();
                        break;
                    }
                }
            }
        } else {
            // Altrimenti, gestisci i nemici normali
            enemies.forEach(enemy => {
                enemy.update(deltaTime);
                enemy.draw();
                
                // Verifica collisione con giocatore
                if (player.checkCollision(enemy)) {
                    gameOver();
                }
            });
            
            // Aggiungi nuovi nemici in base alla difficoltà
            if (Math.random() < 0.005 * difficulty && enemies.length < maxEnemies) {
                enemies.push(createEnemy());
            }
        }
        
        // Aggiorna e disegna giocatore
        player.update(deltaTime);
        player.draw();
        
        // Genera effetti glitch casuali
        if (Math.random() < 0.001 * difficulty) {
            glitchEffect();
        }
        
        // Effetto instabilità dei nodi
        if (Math.random() < 0.01 * difficulty) {
            const nodeIdx = Math.floor(Math.random() * nodes.length);
            const node = nodes[nodeIdx];
            createExplosion(node.x, node.y, node.color, 5);
            
            // Movimento casuale del nodo
            node.x += (Math.random() - 0.5) * 20 * difficulty;
            node.y += (Math.random() - 0.5) * 20 * difficulty;
            
            // Mantieni il nodo dentro lo schermo
            node.x = Math.max(0, Math.min(canvas.width, node.x));
            node.y = Math.max(0, Math.min(canvas.height, node.y));
        }
        
        // Ricrea connessioni periodicamente per aggiornare la rete
        if (Math.random() < 0.005) {
            createConnections();
        }
        
        requestAnimationFrame(gameLoop);
    }

    // Funzione glitch
    function glitchEffect() {
        // Split di schermo temporaneo
        ctx.save();
        const sliceHeight = Math.random() * 20 + 10;
        const yPos = Math.random() * canvas.height;
        
        ctx.translate(Math.random() * 10 - 5, 0);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(
            canvas, 
            0, yPos, canvas.width, sliceHeight, 
            0, yPos + (Math.random() * 20 - 10), canvas.width, sliceHeight
        );
        ctx.restore();
        
        // Effetto colore casuale
        ctx.save();
        ctx.globalCompositeOperation = 'hue-rotate';
        ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Game over
    function gameOver() {
        gameActive = false;
        
        // Esplosione finale
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                createExplosion(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    ['#ff00ff', '#00ffff', '#ffff00'][Math.floor(Math.random() * 3)],
                    50
                );
            }, i * 100);
        }
        
        // Mostra schermata game over
        finalScoreElement.textContent = Math.floor(gameTime / 1000);
        gameOverElement.classList.remove('hidden');
        
        // Continua ad animare le particelle
        function finalAnimation() {
            if (gameActive) return;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Aggiorna e disegna particelle
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                
                particle.x += Math.cos(particle.angle) * particle.speed;
                particle.y += Math.sin(particle.angle) * particle.speed;
                particle.life -= particle.decay * 0.5;
                
                if (particle.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${particle.color.replace(/[^\d,]/g, '')}, ${particle.life})`;
                    ctx.fill();
                }
            }
            
            requestAnimationFrame(finalAnimation);
        }
        
        finalAnimation();
    }

    // Event listeners
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Per dispositivi touch
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    });
    
    restartButton.addEventListener('click', () => {
        initGame();
        requestAnimationFrame(gameLoop);
    });
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Inizio gioco
    initGame();
    requestAnimationFrame(gameLoop);
}); 