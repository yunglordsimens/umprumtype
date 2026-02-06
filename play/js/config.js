export const defaultConfig = {
    version: '3.1',
    baseFontSize: 24,
    currentFontFamily: 'AnanasRegular',
    activeText: '',
    targetGlyphCount: 1200,
    mobileMaxGlyphs: 800,
    interactionRadius: 280,
    maxScale: 3.5,
    darkMode: false,
    waveEffect: false,
    bloomEffect: false,
    scatterEffect: false,
    idleStrength: 0.15,
    paused: false,
    lastFontName: 'Ananas',
    lastStyleIndex: 0,
    lastTx: 0,
    lastTy: 0
};

export let config = JSON.parse(JSON.stringify(defaultConfig));