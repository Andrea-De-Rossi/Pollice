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

    // Audio system
    let bgMusic = null;
    let isMusicEnabled = true;
    
    // Inizializza la musica
    function initAudio() {
        // Crea elemento audio
        bgMusic = new Audio();
        
        // Imposta le proprietà
        bgMusic.loop = true;
        bgMusic.volume = 0.5;
        
        // URL del file audio (usando file locale)
        bgMusic.src = 'Neon Chase.mp3'; // File locale di background music
        
        // Gestisci errori di caricamento
        bgMusic.onerror = (e) => {
            console.log('Errore nel caricamento della musica:', e);
            // Usa un backup alternativo se il file locale non è disponibile
            bgMusic.src = 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg';
        };
        
        // Crea e aggiungi controllo del suono
        createMusicControl();
        
        // Mostra un grande pulsante "Play Music" all'inizio per gestire l'interazione utente
        createInitialPlayButton();
    }
    
    // Crea un grande pulsante di riproduzione iniziale
    function createInitialPlayButton() {
        const playButton = document.createElement('div');
        playButton.id = 'initialPlayButton';
        playButton.textContent = 'PLAY MUSIC';
        playButton.style.position = 'absolute';
        playButton.style.top = '50%';
        playButton.style.left = '50%';
        playButton.style.transform = 'translate(-50%, -50%)';
        playButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        playButton.style.color = '#00aaff';
        playButton.style.padding = '20px 40px';
        playButton.style.borderRadius = '10px';
        playButton.style.cursor = 'pointer';
        playButton.style.zIndex = '2000';
        playButton.style.fontSize = '24px';
        playButton.style.fontWeight = 'bold';
        playButton.style.border = '2px solid #00aaff';
        playButton.style.boxShadow = '0 0 20px #00aaff';
        
        playButton.addEventListener('click', () => {
            // Tenta di riprodurre l'audio per sbloccare la riproduzione
            bgMusic.play()
                .then(() => {
                    console.log('Riproduzione musica avviata con successo');
                    // Nascondi il pulsante
                    playButton.style.display = 'none';
                })
                .catch(e => {
                    console.log('Errore nella riproduzione:', e);
                    // Mostra messaggio di errore
                    playButton.textContent = 'AUDIO BLOCKED BY BROWSER';
                    playButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                    
                    // Nascondi dopo 3 secondi
                    setTimeout(() => {
                        playButton.style.display = 'none';
                    }, 3000);
                });
        });
        
        document.body.appendChild(playButton);
    }
    
    // Crea un controllo per il suono
    function createMusicControl() {
        const musicControl = document.createElement('div');
        musicControl.id = 'musicControl';
        musicControl.innerHTML = '🔊';
        musicControl.style.position = 'absolute';
        musicControl.style.top = '20px';
        musicControl.style.right = '20px';
        musicControl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        musicControl.style.color = '#fff';
        musicControl.style.padding = '10px';
        musicControl.style.borderRadius = '50%';
        musicControl.style.cursor = 'pointer';
        musicControl.style.zIndex = '1000';
        musicControl.style.width = '20px';
        musicControl.style.height = '20px';
        musicControl.style.display = 'flex';
        musicControl.style.justifyContent = 'center';
        musicControl.style.alignItems = 'center';
        musicControl.style.fontSize = '16px';
        
        musicControl.addEventListener('click', toggleMusic);
        
        document.body.appendChild(musicControl);
    }
    
    // Alterna l'attivazione/disattivazione della musica
    function toggleMusic() {
        isMusicEnabled = !isMusicEnabled;
        
        const musicControl = document.getElementById('musicControl');
        if (musicControl) {
            musicControl.innerHTML = isMusicEnabled ? '🔊' : '🔇';
        }
        
        if (isMusicEnabled) {
            bgMusic.play().catch(e => {
                console.log('Errore nella riproduzione:', e);
                // Mostra messaggio di errore audio
                showAudioErrorMessage();
            });
        } else {
            bgMusic.pause();
        }
    }
    
    // Mostra un messaggio di errore audio
    function showAudioErrorMessage() {
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Click anywhere to enable audio';
        errorMsg.style.position = 'absolute';
        errorMsg.style.top = '60px';
        errorMsg.style.right = '20px';
        errorMsg.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        errorMsg.style.color = 'white';
        errorMsg.style.padding = '10px';
        errorMsg.style.borderRadius = '5px';
        errorMsg.style.zIndex = '2000';
        
        document.body.appendChild(errorMsg);
        
        // Rimuovi dopo 3 secondi
        setTimeout(() => {
            if (errorMsg.parentNode) {
                errorMsg.parentNode.removeChild(errorMsg);
            }
        }, 3000);
        
        // Aggiungi un event listener globale per sbloccare l'audio
        const unlockAudio = () => {
            bgMusic.play().catch(e => console.log('Still cannot play audio:', e));
            
            // Rimuovi l'event listener dopo il primo click
            document.removeEventListener('click', unlockAudio);
        };
        
        document.addEventListener('click', unlockAudio);
    }

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
    
    // Variabili per la fase finale del boss
    let bossColorTimer = 0;
    let bossColorCycle = 0;
    let finaleMessageShown = false;
    let phase4RandomLaserColor = '#ff0000';
    
    // Variabili per tutorial
    let tutorialPhase = 0; // 0: nessun tutorial, 1-3: fasi tutorial
    let tutorialTimer = 0;
    let tutorialElement = null;
    const TUTORIAL_MESSAGES = [
        { text: "YOU MOVE WITH THE MOUSE", startTime: 1000, endTime: 3000 },
        { text: "YOU DEAL DAMAGE WITH COLLISION", startTime: 4000, endTime: 6000 },
        { text: "WAIT FOR -HIT IT- MESSAGE TO DAMAGE THE BOSS", startTime: 7000, endTime: 9000 }
    ];
    
    // Sistema bosses
    const bossList = [
        {
            name: "Sprizzalampo",
            color: "#ffcc00",
            size: 40,
            hp: 4,
            speed: 0.7,
            specialAbility: "laserCannons", // Cannoni laser che orbitano
            cannonAngle: 0,
            shootTimer: 0,
            currentPhase: 1, // Fase attuale del boss (1-4 in base a HP)
            nextCannonToShoot: 0, // Per la sequenza di fuoco clockwise
            cannons: [
                { angle: 0, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: Math.PI/2, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 3*Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: Math.PI, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 5*Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 3*Math.PI/2, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 7*Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null }
            ],
            behavior: function(deltaTime) {
                if (bossPhase === 'vulnerable') {
                    // Durante la fase vulnerabile, rimane al centro dello schermo e disabilita i cannoni
                    this.x = canvas.width / 2;
                    this.y = canvas.height / 2;
                    
                    // Disattiva i laser durante la fase vulnerabile
                    this.cannons.forEach(cannon => {
                        cannon.laserActive = false;
                        cannon.readyToShoot = false;
                        cannon.blinkTimer = 0;
                    });
                    
                } else if (bossPhase === 'recovery') {
                    // Durante la fase di recupero, rimane al centro e non spara
                    this.x = canvas.width / 2;
                    this.y = canvas.height / 2;
                    
                    // Disattiva i laser durante la fase di recupero
                    this.cannons.forEach(cannon => {
                        cannon.laserActive = false;
                        cannon.readyToShoot = false;
                        cannon.blinkTimer = 0;
                    });
                    
                    // Emetti particelle per l'effetto di recupero
                    if (Math.random() < 0.3) {
                        createParticle(this.x, this.y, this.color);
                    }
                    
                } else {
                    // Durante la fase di attacco, rimane al centro e ruota i cannoni
                    this.x = canvas.width / 2;
                    this.y = canvas.height / 2;
                    
                    // Aggiorna timer di sparo
                    this.shootTimer = (this.shootTimer || 0) + deltaTime;
                    
                    // Gestione dei cannoni laser in base alla fase corrente
                    this.updateCannons(deltaTime);
                }
                
                // Aggiornamento scia
                if (this.trail.length > this.maxTrail) {
                    this.trail.shift();
                }
                this.trail.push({ x: this.x, y: this.y, size: this.size });
            },
            
            // Aggiornamento dei cannoni laser
            updateCannons(deltaTime) {
                // Rotazione dei cannoni intorno al boss - velocità in base alla fase
                let rotationSpeed;
                
                if (this.currentPhase === 3) {
                    rotationSpeed = 0.0009 * deltaTime; // Fase 3: rotazione più veloce
                } else if (this.currentPhase === 4) {
                    rotationSpeed = 0.0012 * deltaTime; // Fase 4: rotazione ancora più veloce
                } else {
                    rotationSpeed = 0.0003 * deltaTime; // Fase 1-2: rotazione normale
                }
                
                this.cannonAngle = (this.cannonAngle || 0) + rotationSpeed;
                
                // Distanza dei cannoni dal corpo del boss
                const cannonDistance = this.size * 2;
                
                // Aggiornamento posizione di tutti i cannoni
                this.cannons.forEach((cannon, index) => {
                    // Aggiorna la posizione del cannone
                    cannon.angle = this.cannonAngle + (index * Math.PI/4);
                    
                    // Se il laser è attivo, aggiorna anche la posizione dell'endpoint del laser
                    if (cannon.laserActive && cannon.laserEnd) {
                        const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                        const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                        const laserLength = 1500; // Lunghezza fissa del laser
                        
                        // Aggiorna l'endpoint del laser per seguire la rotazione del cannone
                        cannon.laserEnd = {
                            x: cannonX + Math.cos(cannon.angle) * laserLength,
                            y: cannonY + Math.sin(cannon.angle) * laserLength
                        };
                        
                        // Verifica collisione con il giocatore
                        if (this.linePointDistance(
                            cannonX, cannonY, 
                            cannon.laserEnd.x, cannon.laserEnd.y, 
                            player.x, player.y
                        ) < player.size) {
                            gameOver();
                        }
                    }
                });
                
                // Gestione degli spari basata sulla fase del boss
                if (this.currentPhase === 1) {
                    // Fase 1: Comportamento originale - spari casuali multipli
                    this.phaseOneShooting(deltaTime);
                } else if (this.currentPhase === 2) {
                    // Fase 2: Spari in sequenza in senso orario
                    this.phaseTwoShooting(deltaTime);
                } else if (this.currentPhase === 3) {
                    // Fase 3: Tutti i cannoni sparano tranne due, con rotazione più veloce
                    this.phaseThreeShooting(deltaTime);
                } else if (this.currentPhase === 4) {
                    // Fase 4: Attacco finale con colori variabili
                    this.phaseFourShooting(deltaTime);
                }
            },
            
            // Fase 1: Comportamento originale di sparo
            phaseOneShooting(deltaTime) {
                // Gestione degli spari che avvengono ogni 2 secondi
                if (this.shootTimer > 2000) {
                    this.shootTimer = 0;
                    
                    // Determina quanti cannoni spareranno (tra 1 e 4)
                    const cannonCount = 1 + Math.floor(Math.random() * 4);
                    
                    // Sceglie a caso quali cannoni spareranno
                    const shootingCannons = this.getRandomCannons(cannonCount);
                    
                    // Prepara i cannoni selezionati per sparare
                    shootingCannons.forEach(cannonIndex => {
                        const cannon = this.cannons[cannonIndex];
                        cannon.readyToShoot = true;
                        cannon.blinkTimer = 0;
                        
                        // Calcola la posizione del cannone per l'effetto particella
                        const cannonDistance = this.size * 2;
                        const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                        const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                        
                        try {
                            createParticle(cannonX, cannonY, "#ff0000");
                        } catch (e) {
                            // Ignora errori nella creazione di particelle
                        }
                    });
                }
                
                // Gestione lampeggio e attivazione laser
                this.updateCannonBlinking(deltaTime);
            },
            
            // Fase 2: Sparo sequenziale in senso orario
            phaseTwoShooting(deltaTime) {
                const cannonDistance = this.size * 2;
                
                // Spara un cannone alla volta in sequenza ogni 0.25 secondi (era 0.5 secondi)
                if (this.shootTimer > 250) {
                    this.shootTimer = 0;
                    
                    // Prepara il prossimo cannone a sparare
                    const cannon = this.cannons[this.nextCannonToShoot];
                    cannon.readyToShoot = true;
                    cannon.blinkTimer = 0;
                    
                    // Calcola la posizione del cannone per l'effetto particella
                    const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                    const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                    
                    try {
                        createParticle(cannonX, cannonY, "#ff0000");
                    } catch (e) {
                        // Ignora errori nella creazione di particelle
                    }
                    
                    // Passa al prossimo cannone in senso orario
                    this.nextCannonToShoot = (this.nextCannonToShoot + 1) % this.cannons.length;
                }
                
                // Gestione lampeggio e attivazione laser
                this.updateCannonBlinking(deltaTime);
            },
            
            // Fase 3: Tutti i cannoni sparano tranne due (pattern a muro con apertura)
            phaseThreeShooting(deltaTime) {
                // Spara ogni 3 secondi
                if (this.shootTimer > 3000) {
                    this.shootTimer = 0;
                    
                    // Seleziona due cannoni casuali da NON sparare (creando un'apertura)
                    const safeIndices = this.getRandomCannons(2);
                    const safeSet = new Set(safeIndices);
                    
                    // Prepara tutti gli altri cannoni per sparare
                    this.cannons.forEach((cannon, index) => {
                        // Se non è nell'insieme dei cannoni "sicuri", preparalo a sparare
                        if (!safeSet.has(index)) {
                            cannon.readyToShoot = true;
                            cannon.blinkTimer = 0;
                            
                            // Calcola la posizione del cannone per l'effetto particella
                            const cannonDistance = this.size * 2;
                            const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                            const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                            
                            try {
                                createParticle(cannonX, cannonY, "#ff0000");
                            } catch (e) {
                                // Ignora errori nella creazione di particelle
                            }
                        }
                    });
                    
                    // Mostra un effetto più intenso per indicare il pattern pericoloso
                    glitchEffect();
                }
                
                // Gestione lampeggio e attivazione laser
                this.updateCannonBlinking(deltaTime);
            },
            
            // Fase 4: Final phase with color changes and random laser attacks
            phaseFourShooting(deltaTime) {
                // Cambia colore del laser ad ogni ciclo
                if (Math.random() < 0.05) {
                    phase4RandomLaserColor = this.getRandomBrightColor();
                }
                
                // Spara ogni 0.4 secondi con 2 cannoni casuali
                if (this.shootTimer > 400) {
                    this.shootTimer = 0;
                    
                    // Seleziona due cannoni casuali da sparare
                    const shootingIndices = this.getRandomCannons(2);
                    
                    shootingIndices.forEach(index => {
                        const cannon = this.cannons[index];
                        cannon.readyToShoot = true;
                        cannon.blinkTimer = 0;
                        cannon.laserColor = this.getRandomBrightColor(); // Colore casuale per ogni cannone
                        
                        // Calcola la posizione del cannone per l'effetto particella
                        const cannonDistance = this.size * 2;
                        const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                        const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                        
                        try {
                            createParticle(cannonX, cannonY, cannon.laserColor);
                        } catch (e) {
                            // Ignora errori nella creazione di particelle
                        }
                    });
                }
                
                // Gestione lampeggio e attivazione laser
                this.updateCannonBlinking(deltaTime);
            },
            
            // Genera un colore brillante casuale
            getRandomBrightColor() {
                const hue = Math.floor(Math.random() * 360);
                return `hsl(${hue}, 100%, 50%)`;
            },
            
            // Gestione del lampeggio e attivazione laser
            updateCannonBlinking(deltaTime) {
                const cannonDistance = this.size * 2;
                
                this.cannons.forEach((cannon, index) => {
                    // Calcola la posizione del cannone
                    const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                    const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                    
                    // Gestione lampeggio e sparo
                    if (cannon.readyToShoot) {
                        // Lampeggio del cannone prima di sparare
                        cannon.blinkTimer += deltaTime;
                        
                        // Dopo 0.8 secondi di lampeggio, spara
                        if (cannon.blinkTimer > 800) {
                            cannon.readyToShoot = false;
                            cannon.laserActive = true;
                            
                            // Calcola endpoint del laser
                            const laserLength = 1500; // Lunghezza fissa del laser
                            cannon.laserEnd = {
                                x: cannonX + Math.cos(cannon.angle) * laserLength,
                                y: cannonY + Math.sin(cannon.angle) * laserLength
                            };
                            
                            // Effetto sonoro e visivo per lo sparo
                            try {
                                createExplosion(cannonX, cannonY, cannon.laserColor || "#ff0000", 15);
                                glitchEffect();
                            } catch (e) {
                                // Ignora errori negli effetti
                            }
                            
                            // Il laser rimane attivo per 1 secondo
                            setTimeout(() => {
                                if (cannon) {
                                    cannon.laserActive = false;
                                }
                            }, 1000);
                        }
                    }
                });
            },
            
            // Seleziona cannoni casuali per sparare
            getRandomCannons(count) {
                const indices = [];
                const available = [0, 1, 2, 3, 4, 5, 6, 7];
                
                for (let i = 0; i < count; i++) {
                    if (available.length === 0) break;
                    const randomIndex = Math.floor(Math.random() * available.length);
                    const selectedCannonIndex = available.splice(randomIndex, 1)[0];
                    indices.push(selectedCannonIndex);
                }
                
                return indices;
            },
            
            useSpecialAbility: function() {
                // L'abilità speciale è gestita nell'updateCannons
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
                } else if (this.currentPhase === 4 && bossPhase === 'attack') {
                    // Cambio colore continuo per la fase finale
                    const hue = (bossColorCycle % 360);
                    this.color = `hsl(${hue}, 100%, 50%)`;
                } else {
                    this.color = this.normalColor;
                }
                
                // Debug - Disegna linee per vedere la posizione dei cannoni
                const cannonDistance = this.size * 2;
                this.cannons.forEach((cannon, index) => {
                    const cannonX = this.x + Math.cos(cannon.angle) * cannonDistance;
                    const cannonY = this.y + Math.sin(cannon.angle) * cannonDistance;
                    
                    // Disegna il cannone
                    ctx.beginPath();
                    ctx.arc(cannonX, cannonY, this.size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = cannon.readyToShoot ? "#ff0000" : "#ff6600";
                    ctx.fill();
                    
                    // Glow effect
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "#ff6600";
                    ctx.beginPath();
                    ctx.arc(cannonX, cannonY, this.size * 0.3, 0, Math.PI * 2);
                    ctx.fillStyle = "#ff9900";
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Linea di connessione
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(cannonX, cannonY);
                    ctx.strokeStyle = "#ff660080";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    // Disegna il laser se attivo
                    if (cannon.laserActive && cannon.laserEnd) {
                        // Determina il colore del laser - usa il colore specifico del cannone se disponibile
                        const laserColor = cannon.laserColor || "#ff0000";
                        
                        // Laser principale
                        ctx.beginPath();
                        ctx.moveTo(cannonX, cannonY);
                        ctx.lineTo(cannon.laserEnd.x, cannon.laserEnd.y);
                        ctx.strokeStyle = laserColor;
                        ctx.lineWidth = 4;
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = laserColor;
                        ctx.stroke();
                        
                        // Alone esterno del laser
                        ctx.beginPath();
                        ctx.moveTo(cannonX, cannonY);
                        ctx.lineTo(cannon.laserEnd.x, cannon.laserEnd.y);
                        ctx.strokeStyle = `rgba(${laserColor.replace(/[^\d,]/g, '')}, 0.3)`;
                        ctx.lineWidth = 8;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        
                        // Particelle lungo il laser
                        if (Math.random() < 0.3) {
                            const laserDx = cannon.laserEnd.x - cannonX;
                            const laserDy = cannon.laserEnd.y - cannonY;
                            const laserLength = Math.sqrt(laserDx * laserDx + laserDy * laserDy);
                            const particleDistance = Math.random() * laserLength;
                            const ratio = particleDistance / laserLength;
                            const particleX = cannonX + laserDx * ratio;
                            const particleY = cannonY + laserDy * ratio;
                            createParticle(particleX, particleY, laserColor);
                        }
                    }
                });
                
                // Disegna boss principale
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Effetto glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Disegna struttura interna del boss (generatore dei laser)
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = "#ff9900";
                ctx.fill();
                
                // Disegna barra della vita
                const healthBarWidth = this.size * 2;
                const healthBarHeight = 6;
                const maxHp = 4; // Numero fisso di HP per i boss
                const healthPercentage = this.hp / maxHp;
                
                // Sfondo barra della vita
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth, healthBarHeight);
                
                // Barra della vita
                ctx.fillStyle = this.normalColor;
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth * healthPercentage, healthBarHeight);
            },
            
            // Calcola la distanza tra un punto e una linea (per il laser)
            linePointDistance(x1, y1, x2, y2, px, py) {
                // Calcola la lunghezza della linea
                const lineLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                if (lineLength === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
                
                // Calcola la distanza punto-linea
                const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength);
                const t_clamped = Math.max(0, Math.min(1, t));
                
                const closestX = x1 + t_clamped * (x2 - x1);
                const closestY = y1 + t_clamped * (y2 - y1);
                
                return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
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
        
        // Crea il boss con le proprietà base
        const boss = {
            name: bossTemplate.name,
            color: bossTemplate.color,
            size: bossTemplate.size,
            hp: bossTemplate.hp,
            speed: bossTemplate.speed,
            specialAbility: bossTemplate.specialAbility,
            x: canvas.width / 2,  // Spawn at center
            y: canvas.height / 2, // Spawn at center
            trail: [],
            maxTrail: 25,
            vulnerableColor: "#ff0000", // Colore quando vulnerabile
            normalColor: bossTemplate.color, // Salva il colore originale
            currentPhase: 1 // Inizia dalla fase 1
        };
        
        // Inizializza proprietà specifiche in base al tipo di boss
        if (boss.name === "Sprizzalampo") {
            boss.cannonAngle = 0;
            boss.shootTimer = 0;
            boss.nextCannonToShoot = 0;
            boss.cannons = [
                { angle: 0, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: Math.PI/2, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 3*Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: Math.PI, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 5*Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 3*Math.PI/2, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null },
                { angle: 7*Math.PI/4, readyToShoot: false, blinkTimer: 0, laserActive: false, laserEnd: null }
            ];
            
            // Aggiungi i metodi specifici per questo boss
            boss.behavior = bossTemplate.behavior;
            boss.updateCannons = bossTemplate.updateCannons;
            boss.linePointDistance = bossTemplate.linePointDistance;
            boss.draw = bossTemplate.draw;
            boss.getRandomCannons = bossTemplate.getRandomCannons;
            boss.phaseOneShooting = bossTemplate.phaseOneShooting;
            boss.phaseTwoShooting = bossTemplate.phaseTwoShooting;
            boss.phaseThreeShooting = bossTemplate.phaseThreeShooting;
            boss.phaseFourShooting = bossTemplate.phaseFourShooting;
            boss.getRandomBrightColor = bossTemplate.getRandomBrightColor;
            boss.updateCannonBlinking = bossTemplate.updateCannonBlinking;
        }
        
        // Aggiungi metodi comuni
        boss.update = function(deltaTime) {
            // Aggiorna il ciclo di colori per la fase 4
            if (this.currentPhase === 4) {
                bossColorTimer += deltaTime;
                if (bossColorTimer > 50) { // Velocità di cambio colore
                    bossColorCycle += 5;
                    bossColorTimer = 0;
                }
            }
            
            // Usa il comportamento specifico del boss
            this.behavior(deltaTime);
        };
        
        boss.damage = function() {
            this.hp -= 1;
            createExplosion(this.x, this.y, this.color, 30);
            
            // Effetto glitch quando viene colpito
            glitchEffect();
            
            // Aggiorna la fase del boss in base agli HP rimanenti
            this.currentPhase = 5 - this.hp; // Fase 1 = 4 HP, Fase 2 = 3 HP, ecc.
            console.log(`Boss entered phase ${this.currentPhase}`);
            
            // Se entra nella fase 4 (fase finale), mostra il messaggio drammatico
            if (this.currentPhase === 4 && !finaleMessageShown) {
                showFinaleBossMessage();
                finaleMessageShown = true;
            }
            
            // Controllo se è stato sconfitto
            if (this.hp <= 0) {
                defeatBoss();
            } else {
                // Passa alla fase di recupero
                bossPhase = 'recovery';
                bossPhaseTimer = 0;
                hitMessage.classList.add('hidden');
            }
        };
        
        // Se non è stato fornito un metodo draw specifico, usa quello di default
        if (!boss.draw) {
            boss.draw = function() {
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
                } else if (this.currentPhase === 4 && bossPhase === 'attack') {
                    // Cambio colore continuo per la fase finale
                    const hue = (bossColorCycle % 360);
                    this.color = `hsl(${hue}, 100%, 50%)`;
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
                const maxHp = 4; // Numero fisso di HP per i boss
                const healthPercentage = this.hp / maxHp;
                
                // Sfondo barra della vita
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth, healthBarHeight);
                
                // Barra della vita
                ctx.fillStyle = this.normalColor;
                ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.size - 15, healthBarWidth * healthPercentage, healthBarHeight);
                
                ctx.shadowBlur = 0;
            };
        }
        
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
        if (!currentBoss) return; // Previene esecuzioni multiple

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
        const defeatedBoss = currentBoss; // Salva riferimento temporaneo
        currentBoss = null; // Imposta subito a null per prevenire riferimenti
        bossTimer = 0;
        bossPhase = 'attack';
        bossPhaseTimer = 0;
        hitMessage.classList.add('hidden');
        
        // Reset delle variabili specifiche della fase 4
        bossColorTimer = 0;
        bossColorCycle = 0;
        finaleMessageShown = false;
        
        // Pulisci eventuali timeout e riferimenti a oggetti che potrebbero causare memory leak
        document.querySelectorAll('.boss-message').forEach(el => el.remove());
        
        // Assicurati che il gameLoop continui e che vengano creati nuovi nemici
        setTimeout(() => {
            if (gameActive) {
                // Crea qualche nemico subito dopo la sconfitta del boss
                for (let i = 0; i < 3; i++) {
                    enemies.push(createEnemy());
                }
            }
        }, 1000);
        
        // Incrementa difficoltà
        difficulty += 0.5;
        
        console.log("Boss sconfitto con successo!");
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
        tutorialPhase = 0;
        tutorialTimer = 0;
        
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
        
        // Rimuovi tutorial precedenti se presenti
        removeTutorialText();
        
        // Nascondi game over, annuncio boss e messaggio HIT IT
        gameOverElement.classList.add('hidden');
        bossAnnounce.classList.add('hidden');
        hitMessage.classList.add('hidden');
        
        // Reset timer boss UI
        updateBossTimerUI(0);
        
        // Avvia la musica di background
        if (bgMusic && isMusicEnabled) {
            bgMusic.currentTime = 0;
            bgMusic.play().catch(e => console.log('Errore nella riproduzione:', e));
        }
    }
    
    // Aggiorna l'UI del timer del boss
    function updateBossTimerUI(percentage) {
        bossTimerFill.style.height = `${percentage}%`;
        
        // Aggiorna il countdown in secondi
        const remainingSeconds = Math.ceil((BOSS_SPAWN_TIME - bossTimer) / 1000);
        bossCountdown.textContent = `${remainingSeconds}s`;
    }

    // Funzione per mostrare il testo del tutorial
    function showTutorialText(message) {
        // Rimuovi qualsiasi testo tutorial precedente
        removeTutorialText();
        
        // Crea nuovo elemento per il testo tutorial
        tutorialElement = document.createElement('div');
        tutorialElement.className = 'tutorial-text';
        tutorialElement.textContent = message;
        tutorialElement.style.position = 'absolute';
        tutorialElement.style.top = '50%';
        tutorialElement.style.left = '50%';
        tutorialElement.style.transform = 'translate(-50%, -50%)';
        tutorialElement.style.color = '#ffffff';
        tutorialElement.style.fontFamily = 'Arial, sans-serif';
        tutorialElement.style.fontSize = '36px';
        tutorialElement.style.fontWeight = 'bold';
        tutorialElement.style.textAlign = 'center';
        tutorialElement.style.textShadow = '0 0 10px #00aaff';
        tutorialElement.style.zIndex = '1000';
        tutorialElement.style.pointerEvents = 'none';
        tutorialElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        tutorialElement.style.padding = '15px 30px';
        tutorialElement.style.borderRadius = '10px';
        
        // Aggiungi al DOM
        document.body.appendChild(tutorialElement);
        
        // Effetto di fade-in
        tutorialElement.style.opacity = '0';
        tutorialElement.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            if (tutorialElement) tutorialElement.style.opacity = '1';
        }, 50);
    }

    // Funzione per rimuovere il testo del tutorial
    function removeTutorialText() {
        // Rimuovi elementi tutorial esistenti
        const tutorialTexts = document.querySelectorAll('.tutorial-text');
        tutorialTexts.forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 500);
        });
        
        tutorialElement = null;
    }

    // Aggiorna il tutorial in base al timer
    function updateTutorial(deltaTime) {
        if (bossActive) {
            // Rimuovi tutorial quando inizia il boss
            if (tutorialElement) {
                removeTutorialText();
            }
            return;
        }
        
        tutorialTimer += deltaTime;
        
        // Controlla se è tempo di mostrare un nuovo messaggio
        TUTORIAL_MESSAGES.forEach((message, index) => {
            if (tutorialTimer >= message.startTime && tutorialTimer <= message.endTime) {
                if (tutorialPhase !== index + 1) {
                    tutorialPhase = index + 1;
                    showTutorialText(message.text);
                }
            }
        });
        
        // Rimuovi il messaggio se siamo fuori dall'intervallo di visualizzazione
        if (tutorialPhase > 0) {
            const currentMessage = TUTORIAL_MESSAGES[tutorialPhase - 1];
            if (tutorialTimer > currentMessage.endTime) {
                tutorialPhase = 0;
                removeTutorialText();
            }
        }
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
            
            // Aggiorna tutorial
            updateTutorial(deltaTime);
            
            // Spawn boss quando il timer raggiunge il tempo previsto
            if (bossTimer >= BOSS_SPAWN_TIME) {
                spawnBoss();
            }
        } else if (currentBoss) {
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
            
            // Controllo aggiuntivo per i laser di Sprizzalampo
            if (currentBoss && currentBoss.name === "Sprizzalampo" && bossPhase === 'attack') {
                // Controlla la collisione con i laser attivi
                if (currentBoss.cannons) { // Verifica che i cannons esistano
                    currentBoss.cannons.forEach(cannon => {
                        if (cannon.laserActive && cannon.laserEnd) {
                            const cannonX = currentBoss.x + Math.cos(cannon.angle) * currentBoss.size * 2;
                            const cannonY = currentBoss.y + Math.sin(cannon.angle) * currentBoss.size * 2;
                            
                            // Usa il metodo linePointDistance per controllare la collisione con il laser
                            if (currentBoss.linePointDistance(
                                cannonX, cannonY,
                                cannon.laserEnd.x, cannon.laserEnd.y,
                                player.x, player.y
                            ) < player.size) {
                                gameOver();
                            }
                        }
                    });
                }
            }
        } else {
            // Reset di bossActive se currentBoss non esiste
            if (bossActive && !currentBoss) {
                bossActive = false;
                bossTimer = 0;
            }
            
            // Gestisci i nemici solo se non siamo in fase tutorial (primi 10 secondi)
            if (bossTimer >= BOSS_SPAWN_TIME || bossDefeated > 0) {
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
        
        // Rimuovi tutorial se presente
        removeTutorialText();
        
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
        
        // Sfuma la musica
        if (bgMusic) {
            const fadeOutInterval = setInterval(() => {
                if (bgMusic.volume > 0.05) {
                    bgMusic.volume -= 0.05;
                } else {
                    bgMusic.pause();
                    bgMusic.volume = 0.5; // Ripristina il volume
                    clearInterval(fadeOutInterval);
                }
            }, 100);
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

    // Mostrar il messaggio finale del boss
    function showFinaleBossMessage() {
        // Testo da mostrare
        const message = "I WILL NOW SHOW MY TRUE COLORS!";
        
        // Crea elemento per il messaggio
        const messageElement = document.createElement('div');
        messageElement.className = 'boss-message'; // Aggiungi una classe per facile riferimento
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.fontFamily = 'Arial, sans-serif';
        messageElement.style.fontSize = '72px'; // Molto più grande
        messageElement.style.fontWeight = 'bold';
        messageElement.style.zIndex = '1000';
        messageElement.style.textAlign = 'center';
        messageElement.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.7)';
        messageElement.style.lineHeight = '1.2';
        messageElement.style.pointerEvents = 'none'; // Assicura che il testo non interferisca con il gioco
        
        // Crea ogni lettera con un colore diverso
        for (let i = 0; i < message.length; i++) {
            const letterSpan = document.createElement('span');
            letterSpan.textContent = message[i];
            
            // Colore casuale brillante per ogni lettera
            const hue = Math.floor(Math.random() * 360);
            letterSpan.style.color = `hsl(${hue}, 100%, 50%)`;
            
            // Effetto glow dello stesso colore
            letterSpan.style.textShadow = `0 0 20px hsl(${hue}, 100%, 70%)`;
            
            // Aggiungi un po' di movimento alle lettere
            letterSpan.style.display = 'inline-block';
            letterSpan.style.transform = `translateY(${Math.sin(i) * 10}px)`;
            letterSpan.style.transition = 'transform 0.5s ease';
            
            // Effetto di ingrandimento periodico
            setTimeout(() => {
                if (letterSpan.parentNode) {
                    letterSpan.style.transform = `translateY(${Math.cos(i) * 10}px) scale(1.2)`;
                    setTimeout(() => {
                        if (letterSpan.parentNode) {
                            letterSpan.style.transform = `translateY(${Math.sin(i) * 10}px)`;
                        }
                    }, 300);
                }
            }, i * 50);
            
            messageElement.appendChild(letterSpan);
        }
        
        document.body.appendChild(messageElement);
        
        // Effetti glitch multipli più intensi
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                glitchEffect();
            }, i * 150);
        }
        
        // Rimuovi il messaggio dopo 3 secondi
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 3000);
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

    // Inizializza il sistema audio
    initAudio();

    // Inizio gioco
    initGame();
    requestAnimationFrame(gameLoop);
}); 