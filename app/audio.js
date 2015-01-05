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

// connect oscillator to gain node to speakers

// for rn, watch pinking value and set the volume accordingly.
// the pinking filter drastically lowers sound volume so we have to use something like 5 for default,
// whereas a 5 would normally break ur speakers.

var pinking = true;

oscillator.connect(pinkingFilter);
pinkingFilter.connect(gainNode);
gainNode.connect(audioCtx.destination);

// create initial theremin frequency and volumn values

var initialFreq = 0;

// .00001 increments work
var initialVol = 0.00;

// set options for the oscillator
oscillator.type = 'sine';
oscillator.frequency.value = initialFreq; // value in hertz
// oscillator.detune.value = 100; // value in cents
oscillator.start();
gainNode.gain.value = initialVol;


// Leap Loop Section
////////////////////////////


// Setup Leap loop with frame callback function
var controllerOptions = {enableGestures: true};


Leap.loop(controllerOptions, function(frame) {
  var volume = 0;
  var volumeCoordinate = 60;
  var pitchCoordintateY = 60;
  var pitchCoordintateZ = 300;

  var circle = document.getElementById("circle");


  if (frame.hands.length > 0) {
    // volume control
    /////////////////
    var left = frame.hands[0].type === "left" ? frame.hands[0] : frame.hands[1];

    if (left) {
      
      // palmPosition is an array with [x,y,z] coordinates.
      volumeCoordinate = left.palmPosition[1];

      // volume should go from y = 100 to y = 300?
      volumeCoordinate = Math.max(volumeCoordinate, 60);
      volumeCoordinate = Math.min(volumeCoordinate, 400);

      volume = pinking ? (volumeCoordinate - 60)/ 100 : (volumeCoordinate - 60)/1000;

      gainNode.gain.value = volume || 0;



    }
      
    // frequency control section
    /////////////////////////////

    var right = frame.hands[0].type === "right" ? frame.hands[0] : frame.hands[1];
    if (right) {

      // y should adjust the pitch
      // z should adjust the pitch
      //  the closer the hand gets towards antenna, the higher the pitch
      // the higher the hand gets, the higher the pitch

      // right.pointables[0].tipPosition gives xyz coords of pointers (fingers)
      // get the pointable with the lowest Z and use that for the pitch Z instead of palm

      var z = 999;
      for (var l = 0; l < right.pointables.length; l++) {
        if (right.pointables[l].tipPosition[2] < z) {
          z = right.pointables[l].tipPosition[2];
        }
      }
      pitchCoordintateY = right.palmPosition[1];
      pitchCoordintateZ = z;

      pitchCoordintateY = Math.max(pitchCoordintateY, 60);
      pitchCoordintateY = Math.min(pitchCoordintateY, 400);

      pitchCoordintateZ = Math.max(pitchCoordintateZ, -100);
      pitchCoordintateZ = Math.min(pitchCoordintateZ, 300);

      var hz = (0 + pitchCoordintateY) + (500 - (2 * pitchCoordintateZ));
      oscillator.frequency.value = hz;

    }

  }

  circle.style.height = volumeCoordinate-60  + "px";
  circle.style.width = volumeCoordinate-60  + "px";
  circle.style.borderRadius = (volumeCoordinate-60)/2 + "px";
  
  // so this terrible formula sets the default margin to 250 (500/2).
  // its then set according to the height, so as the circle expands, it always does so evenly in all directions, rather than downwards
  circle.style.margin = (500-volumeCoordinate-60)/2 + "px auto";

  // some magic formula to come up with a color
  // 765 possible color options (255*3)
  circle.style.backgroundColor = "black";

  // circle.style.backgroundColor = 'rgb(' + [r,g,b].join(',') + ')';

});
