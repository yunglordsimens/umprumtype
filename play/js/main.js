import { config } from './config.js';
import { loadFonts } from './fonts.js';
import { initKeyboardShortcuts, checkPerformance } from './utils.js';
import { sketch } from './canvas.js';
import './ui.js';

// Expose necessary globals
import { grid } from './grid.js';
import { resetAll } from './ui.js';

window.grid = grid;
window.resetAll = resetAll;

document.addEventListener('DOMContentLoaded', () => {
    loadFonts();
    initKeyboardShortcuts();
    
    // Initialize p5 sketch
    new p5(sketch, 'canvas-container');
    
    // Performance monitoring
    setInterval(() => {
        checkPerformance();
    }, 1000);
});