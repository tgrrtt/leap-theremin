// create web audio api context
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// create Oscillator and gain node
var oscillator = audioCtx.createOscillator();
var gainNode = audioCtx.createGain();
var bufferSize = 4096;

var pinkingFilter = (function() {
    var b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    var node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    node.onaudioprocess = function(e) {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            b0 = 0.99886 * b0 + input[i] * 0.0555179;
            b1 = 0.99332 * b1 + input[i] * 0.0750759;
            b2 = 0.96900 * b2 + input[i] * 0.1538520;
            b3 = 0.86650 * b3 + input[i] * 0.3104856;
            b4 = 0.55000 * b4 + input[i] * 0.5329522;
            b5 = -0.7616 * b5 - input[i] * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + input[i] * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = input[i] * 0.115926;
        }
    }
    return node;
})();

var moogFilter = (function() {
    var node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    var in1, in2, in3, in4, out1, out2, out3, out4;
    in1 = in2 = in3 = in4 = out1 = out2 = out3 = out4 = 0.0;
    node.cutoff = 0.065; // between 0.0 and 1.0
    node.resonance = 3.99; // between 0.0 and 4.0
    node.onaudioprocess = function(e) {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        var f = node.cutoff * 1.16;
        var fb = node.resonance * (1.0 - 0.15 * f * f);
        for (var i = 0; i < bufferSize; i++) {
            input[i] -= out4 * fb;
            input[i] *= 0.35013 * (f*f)*(f*f);
            out1 = input[i] + 0.3 * in1 + (1 - f) * out1; // Pole 1
            in1 = input[i];
            out2 = out1 + 0.3 * in2 + (1 - f) * out2; // Pole 2
            in2 = out1;
            out3 = out2 + 0.3 * in3 + (1 - f) * out3; // Pole 3
            in3 = out2;
            out4 = out3 + 0.3 * in4 + (1 - f) * out4; // Pole 4
            in4 = out3;
            output[i] = out4;
        }
    }
    return node;
})();

// connect oscillator to gain node to speakers

// for rn, watch moog value and set the volume accordingly.
// the moog filter drastically lowers sound volume so we have to use something like 5 for default,
// whereas a 5 would normally break ur speakers.
var moog = true;

oscillator.connect(moogFilter);
moogFilter.connect(gainNode);
gainNode.connect(audioCtx.destination);

// create initial theremin frequency and volumn values

var maxFreq = 6000;
var maxVol = 0.02;

var initialFreq = 200;

// .00001 increments work
var initialVol = 0;

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
    // volume control
    var left = frame.hands[0].type === "left" ? frame.hands[0] : frame.hands[1];

    if (left) {
      // palmPosition is an array with [x,y,z] coordinates.
      var volumeCoordinate = left.palmPosition[1];

      // volume should go from y = 100 to y = 300?
      volumeCoordinate = Math.max(volumeCoordinate, 60);
      volumeCoordinate = Math.min(volumeCoordinate, 400);

      var volume = moog? (volumeCoordinate - 60)/ 10 : (volumeCoordinate - 60)/10000;

      gainNode.gain.value = volume || 0;
    }
      
    // frequency control section
    var right = frame.hands[0].type === "right" ? frame.hands[0] : frame.hands[1];
    if (right) {
      // y should be a the pitch
      // z should adjust the pitch
      //  the closer the hand gets towards antenna, the higher the pitch
      // the higher the hand gets, the higher the pitch
      // when the hand is perpendicular to the leapmotion, z = 0. this should be the absolute minimum z value.
      var pitchCoordintateY = right.palmPosition[1];
      var pitchCoordintateZ = right.palmPosition[2];
      console.log(pitchCoordintateY, pitchCoordintateZ);
      pitchCoordintateY = Math.max(pitchCoordintateY, 0);
      pitchCoordintateY = Math.min(pitchCoordintateY, 250);

      pitchCoordintateZ = Math.max(pitchCoordintateZ, 0);
      pitchCoordintateZ = Math.min(pitchCoordintateZ, 250);
      
      var hz = (0 + pitchCoordintateY) + (250 - pitchCoordintateZ);
      oscillator.frequency.value = hz;

    }
  }
});
