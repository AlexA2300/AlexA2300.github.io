// DOM REFERENCES
const track = document.getElementById('sliderTrack');
const knob = document.getElementById('sliderKnob');
const fill = document.getElementById('sliderFill');
const volumeDisplay = document.getElementById('volumeDisplay');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const pupilLeft = document.getElementById('pupilLeft');
const pupilRight = document.getElementById('pupilRight');
const mouth = document.getElementById('mouth');

// STATE
const state = {
    volume: 50,
    isGrabbed: false,
    isCornered: false,
    isDetached: false,
    detachedX: 0,
    detachedY: 0,
    mouseX: 0,
    mouseY: 0,
};

// TUNING CONSTANTS
const EVASION_RADIUS = 120;
const FLEE_DISTANCE = 25;
const CORNER_THRESHOLD = 3;
const GRAB_RADIUS = 35;
const VERTICAL_SCARE_RANGE = 80;
const EVASION_COOLDOWN = 150;
const NERVOUS_RADIUS = 200;
const PANIC_RADIUS = 100;
const DETACH_RADIUS = 80;
const DETACH_VERTICAL_MIN = 40;
const DETACH_FLEE_SPEED = 4;
const REATTACH_RADIUS = 300;
const KNOB_SIZE = 48;

// COOLDOWN TRACKING
let lastEvasionTime = 0;

// HELPERS
// get the knob's center position in viewport coordinates
function getKnobCenter() {
    if (state.isDetached) {
        return { x: state.detachedX, y: state.detachedY };
    }
    const knobRect = knob.getBoundingClientRect();
    return {
        x: knobRect.left + knobRect.width / 2,
        y: knobRect.top + knobRect.height / 2,
    };
}
// calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// clamp a value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// update the visual position of the knob and fill based on current volume
function render() {
    if (!state.isDetached) {
        knob.style.left = state.volume + '%';
    }
    fill.style.width = state.volume + '%';
    volumeDisplay.textContent = Math.round(state.volume) + '%';

    audio.volume = state.volume / 100;

}

// FACE
// move both pupils to look toward the cursor
function updatePupils() {
    const knobCenter = getKnobCenter();
    const dist = distance(state.mouseX, state.mouseY, knobCenter.x, knobCenter.y);

    if (!state.isGrabbed && dist >= NERVOUS_RADIUS) {
        pupilLeft.style.transform = 'translate(-50%, -50%)';
        pupilRight.style.transform = 'translate(-50%, -50%)';
        return;
    }

    const angle = Math.atan2(state.mouseY - knobCenter.y, state.mouseX - knobCenter.x);

    const maxOffset = 2.5;
    const offsetX = Math.cos(angle) * maxOffset;
    const offsetY = Math.sin(angle) * maxOffset;

    const style = 'translate(calc(-50% + ' + offsetX + 'px), calc(-50% + ' + offsetY + 'px))';
    pupilLeft.style.transform = style;
    pupilRight.style.transform = style;

}

// set the knob's mood class based on cursor proximity
function updateExpression() {
    const knobCenter = getKnobCenter();
    const dist = distance(state.mouseX, state.mouseY, knobCenter.x, knobCenter.y);

    knob.classList.remove('mood-nervous', 'mood-panic', 'mood-caught');

    if (state.isGrabbed) {
        knob.classList.add('mood-caught');
    } else if (dist < PANIC_RADIUS) {
        knob.classList.add('mood-panic');
    } else if (dist < NERVOUS_RADIUS) {
        knob.classList.add('mood-nervous');
    }

}

// EVASION
function handleEvasion() {
    if (state.isGrabbed || state.isDetached) return;

    const now = Date.now();
    if (now - lastEvasionTime < EVASION_COOLDOWN) return;

    const knobCenter = getKnobCenter();
    const dist = distance(state.mouseX, state.mouseY, knobCenter.x, knobCenter.y);
    const verticalDist = Math.abs(state.mouseY - knobCenter.y);
    const horizontalDist = Math.abs(state.mouseX - knobCenter.x);

    if (dist < DETACH_RADIUS && verticalDist > DETACH_VERTICAL_MIN && verticalDist > horizontalDist) {

        detachKnob();
        return;
    }

    if (verticalDist > VERTICAL_SCARE_RANGE) {

        state.isCornered = false;
        knob.classList.remove('evading');
        return;
    }

    const atLeftEdge = state.volume <= CORNER_THRESHOLD;
    const atRightEdge = state.volume >= (100 - CORNER_THRESHOLD);

    if ((atLeftEdge || atRightEdge) && dist < EVASION_RADIUS) {
        const cursorIsLeft = state.mouseX < knobCenter.x;

        if (atLeftEdge && !cursorIsLeft) {

            knob.classList.add('evading', 'hopping');
            state.volume = clamp(FLEE_DISTANCE * 2.5, 0, 100);
            lastEvasionTime = now + 400; // Extra cooldown so detach doesn't trigger mid-hop
            state.isCornered = false;
            render();
            setTimeout(function() { knob.classList.remove('hopping'); }, 400);
            return;
        }

        if (atRightEdge && cursorIsLeft) {

            knob.classList.add('evading', 'hopping');
            state.volume = clamp(100 - FLEE_DISTANCE * 2.5, 0, 100);
            lastEvasionTime = now + 400; // Extra cooldown so detach doesn't trigger mid-hop
            state.isCornered = false;
            render();
            setTimeout(function() { knob.classList.remove('hopping'); }, 400);
            return;
        }

    }

    state.isCornered = false;

    if (dist < EVASION_RADIUS) {
        knob.classList.add('evading');

        const cursorIsLeft = state.mouseX < knobCenter.x;
        const fleeDirection = cursorIsLeft ? 1 : -1;

        const proximity = 1 - (dist / EVASION_RADIUS); // 0 at edge, 1 at dead center
        const scaledFlee = FLEE_DISTANCE * (0.4 + proximity * 0.6);

        state.volume = clamp(state.volume + fleeDirection * scaledFlee, 0, 100);
        lastEvasionTime = now;
        render();

    } else {

        knob.classList.remove('evading');
    }

}

// DETACH
let fleeAnimationId = null;
let calmStartTime = 0; 
const CALM_DURATION = 3000;
const DETACH_CHASE_RADIUS = 200;

function detachKnob() {
    if (state.isDetached) return;

    const knobCenter = getKnobCenter();
    state.detachedX = knobCenter.x;
    state.detachedY = knobCenter.y;
    state.isDetached = true;
    calmStartTime = 0;

    knob.classList.add('detached');
    knob.style.left = state.detachedX + 'px';
    knob.style.top = state.detachedY + 'px';
    knob.style.position = 'fixed';

    fleeAnimationId = requestAnimationFrame(fleeLoop);

}

function fleeLoop() {
    if (!state.isDetached || state.isGrabbed) return;

    const dist = distance(state.mouseX, state.mouseY, state.detachedX, state.detachedY);
    const now = Date.now();

    if (dist > REATTACH_RADIUS) {
        knob.classList.remove('running');
        if (calmStartTime === 0) {
            calmStartTime = now;

        } else if (now - calmStartTime > CALM_DURATION) {
            reattachKnob();
            return;

        }
        updatePupils();
        updateExpression();
        fleeAnimationId = requestAnimationFrame(fleeLoop);
        return;

    }

    calmStartTime = 0;

    if (dist < DETACH_CHASE_RADIUS) {
        knob.classList.add('running');

        const dx = state.detachedX - state.mouseX;
        const dy = state.detachedY - state.mouseY;
        const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;

        const proximity = 1 - Math.min(dist / DETACH_CHASE_RADIUS, 1);
        const speed = DETACH_FLEE_SPEED + proximity * 6;

        state.detachedX += (dx / magnitude) * speed;
        state.detachedY += (dy / magnitude) * speed;

        const halfKnob = KNOB_SIZE / 2;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        state.detachedX = clamp(state.detachedX, halfKnob, vw - halfKnob);
        state.detachedY = clamp(state.detachedY, halfKnob, vh - halfKnob);

        const atEdgeX = state.detachedX <= halfKnob || state.detachedX >= vw - halfKnob;
        const atEdgeY = state.detachedY <= halfKnob || state.detachedY >= vh - halfKnob;

        if ((atEdgeX || atEdgeY) && dist < GRAB_RADIUS * 1.5) {
            state.isCornered = true;

        } else {
            state.isCornered = false;

        }

        knob.style.left = state.detachedX + 'px';
        knob.style.top = state.detachedY + 'px';

    } else {
        knob.classList.remove('running');
        state.isCornered = false;

    }

    updatePupils();
    updateExpression();
    fleeAnimationId = requestAnimationFrame(fleeLoop);
}

function reattachKnob() {
    if (!state.isDetached) return;

    state.isDetached = false;

    if (fleeAnimationId) {
        cancelAnimationFrame(fleeAnimationId);
        fleeAnimationId = null;
    }

    knob.classList.remove('detached', 'running');
    knob.style.position = '';
    knob.style.top = '';

    render();
    updateExpression();

}

// GRAB & DRAG
function handleGrabStart(e) {
    e.preventDefault();

    const knobCenter = getKnobCenter();
    const dist = distance(state.mouseX, state.mouseY, knobCenter.x, knobCenter.y);

    if (state.isDetached) {

        if (!state.isCornered || dist > GRAB_RADIUS * 1.5) return;

        state.isGrabbed = true;
        knob.classList.add('grabbed');
        knob.classList.remove('running');
        updateExpression();
        return;

    }

    if (!state.isCornered && dist > GRAB_RADIUS) return;

    state.isGrabbed = true;
    knob.classList.add('grabbed');
    knob.classList.remove('evading');
    updateExpression();

}

function handleDrag(clientX, clientY) {
    if (!state.isGrabbed) return;

    if (state.isDetached) {

        state.detachedX = clientX;
        state.detachedY = clientY;
        knob.style.left = state.detachedX + 'px';
        knob.style.top = state.detachedY + 'px';

        const trackRect = track.getBoundingClientRect();
        const trackCenterY = trackRect.top + trackRect.height / 2;
        const nearTrackVertically = Math.abs(clientY - trackCenterY) < 40;
        const withinTrackX = clientX >= trackRect.left && clientX <= trackRect.right;

        if (nearTrackVertically && withinTrackX) {

            const relativeX = (clientX - trackRect.left) / trackRect.width;
            state.volume = clamp(relativeX * 100, 0, 100);
            reattachKnob();

            state.isGrabbed = true;
            knob.classList.add('grabbed');
            render();
        }

        return;

    }

    const trackRect = track.getBoundingClientRect();
    const relativeX = (clientX - trackRect.left) / trackRect.width;
    state.volume = clamp(relativeX * 100, 0, 100);
    render();

}

function handleGrabEnd() {
    if (!state.isGrabbed) return;

    state.isGrabbed = false;
    state.isCornered = false;
    knob.classList.remove('grabbed');
    updateExpression();

    if (state.isDetached) {
        calmStartTime = 0;
        fleeAnimationId = requestAnimationFrame(fleeLoop);
    }

}

// EVENT LISTENERS
document.addEventListener('mousemove', function(e) {

    state.mouseX = e.clientX;
    state.mouseY = e.clientY;

    if (state.isDetached) {
        handleDrag(e.clientX, e.clientY);
        updatePupils();
        updateExpression();
        return;
    }

    handleDrag(e.clientX, e.clientY);
    handleEvasion();
    updatePupils();
    updateExpression();

});

knob.addEventListener('mousedown', function(e) {

    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    handleGrabStart(e);

});

track.addEventListener('mousedown', function(e) {

    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    if (state.isCornered) {
        handleGrabStart(e);
    }

});

document.addEventListener('mouseup', handleGrabEnd);

document.addEventListener('selectstart', function(e) {

    if (state.isGrabbed) e.preventDefault();

});

// mobile
knob.addEventListener('touchstart', function(e) {

    const touch = e.touches[0];
    state.mouseX = touch.clientX;
    state.mouseY = touch.clientY;
    handleGrabStart(e);

}, { passive: false });

document.addEventListener('touchmove', function(e) {

    const touch = e.touches[0];
    state.mouseX = touch.clientX;
    state.mouseY = touch.clientY;
    handleDrag(touch.clientX);
    handleEvasion();
    updatePupils();
    updateExpression();

}, { passive: true });

document.addEventListener('touchend', handleGrabEnd);

// AUDIO
playBtn.addEventListener('click', function() {

    if (audio.paused) {
        audio.play();
        playBtn.textContent = '⏸ Pause';
        playBtn.classList.add('playing');

    } else {
        audio.pause();
        playBtn.textContent = '▶ Play';
        playBtn.classList.remove('playing');
    }

});

// init
audio.volume = state.volume / 100;
render();