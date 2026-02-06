import { config } from './config.js';
import { grid, generateGrid } from './grid.js';
import { showToast } from './utils.js';
import { applyWaveEffect, applyBloomEffect, applyScatterEffect, applyIdleRotation, drawWatermark } from './effects.js';

export function updateDensitySliderMax() {
    const slider = document.getElementById('densitySlider');
    if (!slider) return;
    const isMobile = window.innerWidth < 800;
    slider.max = isMobile ? config.mobileMaxGlyphs : 2500;
    if (parseInt(slider.value) > parseInt(slider.max)) {
        slider.value = slider.max;
        document.getElementById('densityValue').textContent = `${slider.value} glyphs`;
        config.targetGlyphCount = parseInt(slider.value);
    }
}

export function updateUIFromConfig() {
    document.getElementById('densitySlider').value = config.targetGlyphCount;
    document.getElementById('densityValue').textContent = `${config.targetGlyphCount} glyphs`;
    document.getElementById('radiusSlider').value = config.interactionRadius;
    document.getElementById('radiusValue').textContent = `${config.interactionRadius}px`;
    document.getElementById('scaleSlider').value = config.maxScale;
    document.getElementById('scaleValue').textContent = `${config.maxScale.toFixed(1)}x`;

    document.getElementById('darkToggle').checked = config.darkMode;
    document.getElementById('waveToggle').checked = config.waveEffect;
    document.getElementById('bloomToggle').checked = config.bloomEffect;
    document.getElementById('scatterToggle').checked = config.scatterEffect;
    
    document.body.classList.toggle('dark-mode', config.darkMode);
}

export function updateSettings() {
    generateGrid();
}

function drawPaused(p) {
    p.background(config.darkMode ? 0 : 255);
    p.noStroke();
    grid.forEach(g => {
        const posX = g.x;
        const posY = g.y;
        const scl = g.lastScl || 1;
        
        // Bloom эффект для замороженного состояния
        if (config.bloomEffect) applyBloomEffect(p, g.char, scl, config.darkMode, posX, posY);
        
        p.push();
        p.translate(posX, posY);
        p.scale(scl);
        p.rotate(g.lastRot || 0);
        p.fill(config.darkMode ? 255 : 0);
        p.text(g.char, 0, 0);
        p.pop();
    });
}

function drawGlyphs(p, tx, ty) {
    p.noStroke();
    grid.forEach(g => {
        const d = p.dist(tx, ty, g.baseX, g.baseY);
        const proximity = d < config.interactionRadius ? 1 - (d / config.interactionRadius) : 0;

        const wave = applyWaveEffect(g, p, d, proximity);
        const scatter = applyScatterEffect(g, p, d, proximity);

        const posX = g.baseX + wave.x + scatter.x;
        const posY = g.baseY + wave.y + scatter.y;

        let scl = 1 + (config.maxScale - 1) * proximity;
        let rot = applyIdleRotation(g, p) + (proximity > 0 ? g.angleOffset * proximity * p.PI : 0);

        g.x = posX;
        g.y = posY;
        g.lastScl = scl;
        g.lastRot = rot;

        p.push();
        p.translate(posX, posY);
        p.scale(scl);
        p.rotate(rot);
        p.fill(config.darkMode ? 255 : 0);
        p.text(g.char, 0, 0);
        p.pop();

        // ПЕРЕДАВАТЬ posX и posY в applyBloomEffect
        if (config.bloomEffect) applyBloomEffect(p, g.char, scl, config.darkMode, posX, posY);
    });
}

export const sketch = (p) => {
    window.currentP = p;

    p.setup = () => {
        const container = document.getElementById('canvas-container');
        p.createCanvas(container.offsetWidth, container.offsetHeight);
        p.pixelDensity(1);
        p.textAlign(p.CENTER, p.BASELINE);
    };

    p.draw = () => {
        if (config.paused) {
            drawPaused(p);
            drawWatermark(p);
            return;
        }

        p.background(config.darkMode ? 0 : 255);
        if (grid.length === 0) return;

        let tx = p.mouseX;
        let ty = p.mouseY;
        if (p.touches?.length > 0) {
            tx = p.touches[0].x;
            ty = p.touches[0].y;
        }
        if (tx === 0 && ty === 0 && p.frameCount < 10) {
            tx = ty = -5000;
        }

        config.lastTx = tx;
        config.lastTy = ty;

        drawGlyphs(p, tx, ty);
        drawWatermark(p);
    };

    p.windowResized = () => {
        const container = document.getElementById('canvas-container');
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        updateDensitySliderMax();
        generateGrid();
    };
};