import { config } from './config.js';
import { availableFonts } from './fonts.js';
import { showToast } from './utils.js';

export let grid = [];

export function generateGrid() {
    const p = window.currentP;
    if (!p) return;
    
    try {
        grid = [];
        
        const fontData = availableFonts[config.lastFontName] || availableFonts[Object.keys(availableFonts)[0]];
        if (!fontData) return;
        
        config.currentFontFamily = fontData.cssFamilies[config.lastStyleIndex || 0];
        p.textFont(config.currentFontFamily);
        p.textSize(config.baseFontSize);
        
        let limit = (p.width < 800) ? config.mobileMaxGlyphs : 2500;
        config.targetGlyphCount = Math.min(config.targetGlyphCount, limit);
        
        let area = p.width * p.height;
        let avgAreaPerGlyph = area / config.targetGlyphCount;
        let spacing = p.sqrt(avgAreaPerGlyph);
        
        let gridSpacingX = spacing * 0.85;
        let gridSpacingY = spacing * 1.15;
        
        let cols = p.floor(p.width / gridSpacingX);
        let rows = p.floor(p.height / gridSpacingY);
        
        let startX = (p.width - (cols * gridSpacingX)) / 2 + gridSpacingX / 2;
        let startY = (p.height - (rows * gridSpacingY)) / 2 + gridSpacingY / 2;
        
        let textIdx = 0;
        let txt = config.activeText || fontData.sampleText;
        
        if (txt.length < 5) {
            txt = fontData.sampleText;
        }
        
        if (txt.length < 20) {
            txt = txt.repeat(Math.ceil(100 / txt.length));
        }
        
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.textContent = `${txt.length} chars`;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let char = txt.charAt(textIdx % txt.length);
                textIdx++;
                
                let x = startX + (c * gridSpacingX);
                let y = startY + (r * gridSpacingY);
                
                grid.push({
                    char: char,
                    x: x,
                    y: y,
                    baseX: x,
                    baseY: y,
                    angleOffset: p.random(-1, 1),
                    noiseSeedX: p.random(10000),
                    noiseSeedY: p.random(10000),
                    lastScl: 1,
                    lastRot: 0,
                    charWidth: p.textWidth(char),
                    scatterAmount: 0,
                    scatterAngle: 0
                });
            }
        }
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'grid_generated_v3_1_final', {
                'event_category': 'grid',
                'event_label': config.lastFontName,
                'value': grid.length
            });
        }
        
    } catch (error) {
        console.error('Grid generation error:', error);
        showToast("Error generating grid", 'error');
    }
}