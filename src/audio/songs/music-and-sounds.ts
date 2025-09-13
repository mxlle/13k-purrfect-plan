// This music has been exported by SoundBox. You can use it with
// http://sb.bitsnbites.eu/player-small.js in your own product.

// See http://sb.bitsnbites.eu/demo.html for an example of how to
// use it in a demo.

const instrument = [
  0, // OSC1_WAVEFORM
  91, // OSC1_VOL
  128, // OSC1_SEMI
  0, // OSC1_XENV
  0, // OSC2_WAVEFORM
  95, // OSC2_VOL
  128, // OSC2_SEMI
  12, // OSC2_DETUNE
  0, // OSC2_XENV
  0, // NOISE_VOL
  12, // ENV_ATTACK
  0, // ENV_SUSTAIN
  72, // ENV_RELEASE
  0, // ENV_EXP_DECAY
  0, // ARP_CHORD
  0, // ARP_SPEED
  0, // LFO_WAVEFORM
  0, // LFO_AMT
  0, // LFO_FREQ
  0, // LFO_FX_FREQ
  2, // FX_FILTER
  255, // FX_FREQ
  0, // FX_RESONANCE
  0, // FX_DIST
  32, // FX_DRIVE
  83, // FX_PAN_AMT
  3, // FX_PAN_FREQ
  130, // FX_DELAY_AMT
  4, // FX_DELAY_TIME
];

// Song data
export const song = {
  songData: [
    {
      // Instrument 0
      i: instrument,
      // Patterns
      p: [1, 2, 2, 3, 3, 2, 2, 2, 1],
      // Columns
      c: [
        { n: [122, , , , 127, , , , 122, , , , 127, , , , 122, , , , 126, , , , 122, , , , 127], f: [] },
        { n: [127, , 134, , 126, , 134, , 127, , 134, , 127, , , , 127, , 134, , 126, , 134, , 127, , 134, , 127], f: [] },
        {
          n: [
            127,
            122,
            127,
            122,
            126,
            122,
            126,
            122,
            127,
            122,
            127,
            122,
            127,
            ,
            ,
            ,
            127,
            122,
            127,
            122,
            126,
            122,
            126,
            122,
            127,
            122,
            126,
            122,
            127,
          ],
          f: [],
        },
      ],
    },
    {
      // Instrument 1
      i: instrument,
      // Patterns
      p: [, , 2, 1, 1, 2],
      // Columns
      c: [
        {
          n: [144, , 141, 141, 142, , 139, 139, 137, 139, 141, 142, 144, , , , 144, 144, 141, 141, 142, 142, 139, 139, 137, , 139, , 137],
          f: [],
        },
        {
          n: [132, , 129, 129, 130, , 127, 127, 125, 127, 129, 130, 132, , , , 132, 132, 129, 129, 130, 130, 127, 127, 125, , 127, , 125],
          f: [],
        },
      ],
    },
  ],
  rowLen: 22050, // In sample lengths
  patternLen: 32, // Rows per pattern
  endPattern: 8, // End pattern
  numChannels: 2, // Number of channels
};

export const winSound = {
  songData: [
    {
      // Instrument 1
      i: instrument,
      // Patterns
      p: [1],
      // Columns
      c: [{ n: [135, 139, 142, 147], f: [] }],
    },
  ],
  rowLen: 11025, // In sample lengths
  patternLen: 16, // Rows per pattern
  endPattern: 1, // End pattern
  numChannels: 1, // Number of channels
};

export const loseSound = {
  songData: [
    {
      // Instrument 1
      i: instrument,
      // Patterns
      p: [1],
      // Columns
      c: [{ n: [129, 126, 123, , , , , , , , , , , , , , , , 126, , , , , , , , , , , , , , , , 129], f: [] }],
    },
  ],
  rowLen: 11025, // In sample lengths
  patternLen: 16, // Rows per pattern
  endPattern: 1, // End pattern
  numChannels: 1, // Number of channels
};
