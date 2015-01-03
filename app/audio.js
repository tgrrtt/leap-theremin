// create web audio api context
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// create Oscillator and gain node
var oscillator = audioCtx.createOscillator();
var gainNode = audioCtx.createGain();

// connect oscillator to gain node to speakers

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

// create initial theremin frequency and volumn values

var maxFreq = 6000;
var maxVol = 0.02;

var initialFreq = 3000;

// .00001 increments work
var initialVol = 0.0000;

// set options for the oscillator

oscillator.type = 'sine';
oscillator.frequency.value = initialFreq; // value in hertz
// oscillator.detune.value = 100; // value in cents
oscillator.start();
gainNode.gain.value = initialVol;


// Store frame for motion functions
var previousFrame = null;

// Setup Leap loop with frame callback function
var controllerOptions = {enableGestures: true};

// to use HMD mode:
// controllerOptions.optimizeHMD = true;

Leap.loop(controllerOptions, function(frame) {
  if (frame.hands.length > 0) {
    var left = frame.hands[0].type === "left" ? frame.hands[0] : frame.hands[1];
    // palmPosition is an array with [x,y,z] coordinates.
    var volumeCoordinate = left.palmPosition[1];
    
    // volume should go from y = 100 to y = 300?
    volumeCoordinate = Math.max(volumeCoordinate, 100);
    volumeCoordinate = Math.min(volumeCoordinate, 300);

    var volume = (volumeCoordinate - 100)/10000;

    gainNode.gain.value = volume || 0;
  }
});
