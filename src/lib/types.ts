// Example: {name: 'C', value: 48, cents: 28, octave: 3, frequency: 132.95497131347656}
export interface Pitch {
  // Difference between played note and actual pitch (for tuning)
  cents: number;
  // decimal representing freq in Hz
  frequency: number;
  // The note name, like G#
  name: string;
  // 4 contains middle C
  octave: number;
  // The MIDI value for note, see https://newt.phys.unsw.edu.au/jw/notes.html
  value: number;
}

export const clefs = Object.freeze(['treble', 'bass', 'alto', 'tenor', 'percussion', 'soprano', 'mezzo-soprano', 'baritone-c', 'baritone-f', 'subbass', 'french', 'tab'] as const);
export type Clef = typeof clefs;
