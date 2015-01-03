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
var initialVol = 0.001;

// set options for the oscillator

oscillator.type = 'sine';
oscillator.frequency.value = initialFreq; // value in hertz
// oscillator.detune.value = 100; // value in cents
oscillator.start();
gainNode.gain.value = initialVol;


/*
TODO: Get the left hand y axis to control the volume.
*/
