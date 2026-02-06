import { config } from './config.js';

export function applyWaveEffect(g, p, d, proximity) {
    if (!config.waveEffect) return { x: 0, y: 0 };
    
    let time = p.frameCount * 0.02;
    let baseWaveY = (p.noise(g.noiseSeedY + time) * 2 - 1) * 30;
    let baseWaveX = (p.noise(g.noiseSeedX + time * 0.8) * 2 - 1) * 15;
    
    if (d < config.interactionRadius) {
        let interactiveScale = proximity * 1.5;
        baseWaveY += (p.noise(g.noiseSeedY * 2 + time * 3 + proximity * 10) * 2 - 1) * 60 * interactiveScale;
        baseWaveX += (p.noise(g.noiseSeedX * 2 + time * 2.5 + proximity * 8) * 2 - 1) * 30 * interactiveScale;
    }
    
    return { x: baseWaveX, y: baseWaveY };
}

export function applyBloomEffect(p, char, scl, darkMode, x, y) {
    if (!config.bloomEffect) return;

    for (let i = 4; i > 0; i--) {
        p.push();
        p.translate(x, y);  // ДОБАВИТЬ ЭТО: Переместить в позицию буквы
        p.scale(scl * (1 + i * 0.15));
        p.fill(darkMode ? 'rgba(255,255,255,' + (i*0.15) + ')' : 'rgba(0,0,0,' + (i*0.15) + ')');
        p.text(char, 0, 0);
        p.pop();
    }
}

export function applyScatterEffect(g, p, d, proximity) {
    if (proximity > 0 && config.scatterEffect) {
        g.scatterAmount = p.lerp(g.scatterAmount || 0, proximity * 200, 0.2);
        g.scatterAngle = p.atan2(g.baseY - config.lastTy, g.baseX - config.lastTx);
    } else {
        g.scatterAmount = p.lerp(g.scatterAmount || 0, 0, 0.08);
    }

    return {
        x: p.cos(g.scatterAngle || 0) * g.scatterAmount,
        y: p.sin(g.scatterAngle || 0) * g.scatterAmount
    };
}

export function applyIdleRotation(g, p) {
    if (config.idleStrength <= 0) return 0;
    
    let noiseVal = p.noise(
        g.baseX * 0.005,
        g.baseY * 0.005,
        p.frameCount * 0.003
    );
    return (noiseVal * 2 - 1) * config.idleStrength * 0.5;
}

export function drawWatermark(p) {
    if (!p) return;
    
    p.push();
    p.textAlign(p.RIGHT);
    p.textSize(14);
    p.fill(config.darkMode ? 100 : 150);
    p.text("Typo Umprum Playground v3.1", p.width - 20, p.height - 20);
    p.pop();
}