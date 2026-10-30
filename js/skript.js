const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');

let width = 0;
let height = 0;
let dpr = 1;

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const neonPalette = [
    "#ff0055", "#ff1493", "#ff2a6d", "#ff007f",
    "#ff4d94", "#ff7597", "#ff00bb", "#ffffff", "#ffd1dc"
];

const letterSequence = ['к', 'а', 'т', 'я', 'я', 'т', 'е', 'б', 'е', 'к', 'о', 'х', 'а', 'ю'];
let nextLetterIndex = 0;
let collectedCount = 0;
let isResetting = false;

const floatingLetters = [];
const sparkles = [];
const heartEffects = [];

// Вставка букви в слот та логіка скидання
function activateSlot(index, char) {
    const slot = document.getElementById(`slot-${index}`);
    if (!slot || slot.classList.contains('revealed')) return;

    slot.textContent = char;
    slot.classList.add('revealed');
    collectedCount++;

    const rect = slot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 14; i++) {
        sparkles.push(new Sparkle(cx, cy, "#ff7597"));
    }

    // Коли всі букви зібрані
    if (collectedCount === letterSequence.length) {
        isResetting = true;
        const allSlots = document.querySelectorAll('.letter-slot');
        allSlots.forEach(el => el.classList.add('all-completed'));

        // Спалах грандіозного фінального серця в центрі
        heartEffects.push(new ParticleHeart(width / 2, height / 2, true));

        // Через 3.5 секунди святкування плавно розчиняємо букви
        setTimeout(() => {
            allSlots.forEach(el => el.classList.add('fading-out'));

            // Після завершення анімації зникнення очищаємо слоти для нового кола
            setTimeout(() => {
                allSlots.forEach(el => {
                    el.textContent = '';
                    el.classList.remove('revealed', 'all-completed', 'fading-out');
                });
                collectedCount = 0;
                nextLetterIndex = 0;
                isResetting = false;
            }, 650);
        }, 3500);
    }
}

class FloatingLetter {
    constructor(char, slotIndex, x, y) {
        this.char = char;
        this.slotIndex = slotIndex;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -0.5 - Math.random() * 0.4;
        this.age = 0;
        this.floatTime = 55;
        this.scale = 0.3;
        this.targetScale = 1.0;
        this.state = 'floating';
        this.isAlive = true;
    }

    update() {
        this.age++;

        if (this.state === 'floating') {
            this.x += this.vx;
            this.y += this.vy;
            this.scale += (this.targetScale - this.scale) * 0.16;

            if (this.age >= this.floatTime) {
                this.state = 'flying';
            }
        } else if (this.state === 'flying') {
            const slot = document.getElementById(`slot-${this.slotIndex}`);
            if (slot) {
                const rect = slot.getBoundingClientRect();
                const targetX = rect.left + rect.width / 2;
                const targetY = rect.top + rect.height / 2;

                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.hypot(dx, dy);

                this.x += dx * 0.18;
                this.y += dy * 0.18;
                this.scale += (0.65 - this.scale) * 0.14;

                if (dist < 12) {
                    activateSlot(this.slotIndex, this.char);
                    this.isAlive = false;
                    return;
                }
            } else {
                this.isAlive = false;
                return;
            }
        }

        ctx.save();
        const minDim = Math.min(width, height);
        const baseSize = Math.max(46, Math.min(minDim * 0.08, 62));
        const fontSize = Math.floor(baseSize * this.scale);

        ctx.font = `italic 700 ${fontSize}px "Segoe Script", "Apple Chancery", cursive, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "#ff007f";
        ctx.shadowBlur = 22;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(this.char, this.x, this.y);
        ctx.restore();
    }
}

class Sparkle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4.5 + 1.2;
        this.vx = Math.cos(angle) * spd;
        this.vy = Math.sin(angle) * spd;
        this.radius = Math.random() * 2.4 + 1.1;
        this.color = color;
        this.age = 0;
        this.maxAge = Math.floor(Math.random() * 15 + 22);
        this.isAlive = true;
    }

    update() {
        this.age++;
        if (this.age > this.maxAge) {
            this.isAlive = false;
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy *= 0.94;

        const alpha = 1.0 - (this.age / this.maxAge);
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleHeart {
    constructor(cx, cy, isGrandFinale = false) {
        this.cx = cx;
        this.cy = cy;
        this.isGrandFinale = isGrandFinale;
        this.age = 0;
        this.maxAge = isGrandFinale ? 560 : 420;
        this.particles = [];
        this.isAlive = true;

        const minDimension = Math.min(width, height);
        const scaleMultiplier = isGrandFinale ? 1.6 : 1.0;
        this.heartScale = Math.max(minDimension * 0.0135, 5.2) * scaleMultiplier;

        const baseParticles = width < 768 ? 360 : 500;
        this.numParticles = isGrandFinale ? Math.floor(baseParticles * 1.4) : baseParticles;

        this.init();
    }

    init() {
        for (let i = 0; i < this.numParticles; i++) {
            const t = Math.random() * Math.PI * 2;
            const isBorder = Math.random() < 0.72;
            const r = isBorder ? 1.0 : Math.sqrt(Math.random() * 0.75 + 0.15);

            const blastAngle = Math.random() * Math.PI * 2;
            const startSpeed = (Math.random() * 16 + 7) * (this.isGrandFinale ? 1.3 : 1.0);

            this.particles.push({
                baseT: t,
                rRatio: r,
                flowSpeed: (Math.random() - 0.5) * 0.007,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderSpeed: (Math.random() * 0.05 + 0.02) * (Math.random() < 0.5 ? 1 : -1),
                wanderRadius: Math.random() * (isBorder ? 10 : 18) + 4,
                wanderFreqX: Math.random() * 0.06 + 0.03,
                wanderFreqY: Math.random() * 0.06 + 0.03,
                phase: Math.random() * Math.PI * 2,
                x: this.cx,
                y: this.cy,
                vx: Math.cos(blastAngle) * startSpeed,
                vy: Math.sin(blastAngle) * startSpeed,
                friction: Math.random() * 0.03 + 0.88,
                size: Math.random() * 2.4 + 1.2,
                color: neonPalette[Math.floor(Math.random() * neonPalette.length)],
                shimmer: Math.random() * Math.PI * 2,
                shimmerSpeed: Math.random() * 0.09 + 0.04
            });
        }
    }

    update() {
        this.age++;
        if (this.age > this.maxAge) {
            this.isAlive = false;
            return;
        }

        let pulse = 1.0;
        const pulseStart = 65;
        const pulseEnd = this.maxAge - 70;
        if (this.age >= pulseStart && this.age < pulseEnd) {
            const beat = (this.age - pulseStart) * 0.085;
            pulse = 1.0 + 0.045 * Math.sin(beat) + (Math.sin(beat) > 0.72 ? 0.035 : 0.0);
        }

        let alpha = 1.0;
        if (this.age > pulseEnd) {
            alpha = (this.maxAge - this.age) / 70.0;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.globalCompositeOperation = 'lighter';

        for (let p of this.particles) {
            if (this.age < 30) {
                p.vx *= p.friction;
                p.vy *= p.friction;
                p.x += p.vx;
                p.y += p.vy;
            } else {
                p.baseT += p.flowSpeed;

                const hx = 16 * Math.pow(Math.sin(p.baseT), 3);
                const hy = -(13 * Math.cos(p.baseT) - 5 * Math.cos(2 * p.baseT) - 2 * Math.cos(3 * p.baseT) - Math.cos(4 * p.baseT));

                const heartTargetX = hx * p.rRatio * this.heartScale * pulse;
                const heartTargetY = hy * p.rRatio * this.heartScale * pulse;

                p.wanderAngle += p.wanderSpeed;
                const driftX = Math.cos(p.wanderAngle) * p.wanderRadius + Math.sin(this.age * p.wanderFreqX + p.phase) * 7;
                const driftY = Math.sin(p.wanderAngle) * p.wanderRadius + Math.cos(this.age * p.wanderFreqY + p.phase) * 7;

                const targetX = this.cx + heartTargetX + driftX;
                const targetY = this.cy + heartTargetY + driftY;

                if (this.age >= pulseEnd) {
                    p.y -= 0.8;
                    p.x += Math.sin(this.age * 0.06 + p.phase) * 1.2;
                } else {
                    const easeSpeed = this.age < 75 ? 0.09 : 0.16;
                    p.x += (targetX - p.x) * easeSpeed;
                    p.y += (targetY - p.y) * easeSpeed;
                }
            }

            p.shimmer += p.shimmerSpeed;
            const curRadius = Math.max(0.6, p.size + Math.sin(p.shimmer) * 0.7);

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, curRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        if (this.age >= 75) {
            const textProgress = Math.min(1.0, (this.age - 75) / 25.0);
            const textAlpha = textProgress * alpha;

            ctx.save();
            ctx.globalAlpha = Math.max(0, textAlpha);

            const fontSize = Math.floor(this.heartScale * 3.4);
            ctx.font = `italic 700 ${fontSize}px "Segoe Script", "Apple Chancery", cursive, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.shadowColor = "#ff007f";
            ctx.shadowBlur = 20;
            ctx.fillStyle = "#ffffff";

            const textY = this.cy - (this.heartScale * 0.7) + Math.sin(this.age * 0.085) * 2.5;
            ctx.fillText("i love you", this.cx, textY);
            ctx.restore();
        }
    }
}

let isDown = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let isDragging = false;
const DRAG_THRESHOLD = 24;
const SPAWN_INTERVAL = 42;

function spawnNextLetter(x, y) {
    if (hint) hint.style.opacity = '0';

    // Створюємо букви, якщо не триває фаза перезапуску
    if (!isResetting && nextLetterIndex < letterSequence.length) {
        const char = letterSequence[nextLetterIndex];
        const slotIdx = nextLetterIndex;

        floatingLetters.push(new FloatingLetter(char, slotIdx, x, y));

        for (let i = 0; i < 8; i++) {
            sparkles.push(new Sparkle(x, y, neonPalette[Math.floor(Math.random() * neonPalette.length)]));
        }

        nextLetterIndex++;
    } else {
        sparkles.push(new Sparkle(x, y, neonPalette[Math.floor(Math.random() * neonPalette.length)]));
    }

    lastX = x;
    lastY = y;
}

function handlePointerDown(e) {
    isDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
}

function handlePointerMove(e) {
    if (!isDown) return;

    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!isDragging && totalDist >= DRAG_THRESHOLD) {
        isDragging = true;
        spawnNextLetter(e.clientX, e.clientY);
        return;
    }

    if (isDragging) {
        const distFromLast = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (distFromLast >= SPAWN_INTERVAL) {
            const steps = Math.floor(distFromLast / SPAWN_INTERVAL);
            const dx = (e.clientX - lastX) / distFromLast;
            const dy = (e.clientY - lastY) / distFromLast;

            const toSpawn = Math.min(steps, 4);
            for (let i = 1; i <= toSpawn; i++) {
                spawnNextLetter(lastX + dx * SPAWN_INTERVAL, lastY + dy * SPAWN_INTERVAL);
            }
        }
    }
}

function handlePointerUp(e) {
    if (!isDown) return;
    isDown = false;

    if (!isDragging) {
        if (hint) hint.style.opacity = '0';
        heartEffects.push(new ParticleHeart(startX, startY));
    }
}

canvas.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);

function loop() {
    ctx.fillStyle = '#030306';
    ctx.fillRect(0, 0, width, height);

    for (let i = sparkles.length - 1; i >= 0; i--) {
        sparkles[i].update();
        if (!sparkles[i].isAlive) sparkles.splice(i, 1);
    }

    for (let i = floatingLetters.length - 1; i >= 0; i--) {
        floatingLetters[i].update();
        if (!floatingLetters[i].isAlive) floatingLetters.splice(i, 1);
    }

    for (let i = heartEffects.length - 1; i >= 0; i--) {
        heartEffects[i].update();
        if (!heartEffects[i].isAlive) heartEffects.splice(i, 1);
    }

    requestAnimationFrame(loop);
}

loop();