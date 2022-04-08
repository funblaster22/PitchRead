<script context="module" lang="ts">
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
</script>
<script lang="ts">
  import Card from "./lib/Card.svelte";
  import Tuner, {noteStrings} from "./tuner";
  import ScrollingStaff from "./ScrollingStaff.svelte";
  const tuner = new Tuner(440);
  let currentPitch: Pitch = {};
  tuner.onNoteDetected = (note: Pitch) => {
    note.value += transpose;
    note.name = noteStrings[note.value % 12];
    note.octave = Math.floor(note.value / 12) - 1;
    currentPitch = note;
  }

  // Seconds until the game resumes. -1 means playing, 3 is indefinitely
  let resumeIn = 3;
  let transpose = Number.parseInt(localStorage.transpose) || 0;

  // Why does this feel like REALLY bad design?
  async function countdown() {
    return new Promise<void>(res => {
      if (resumeIn-- > 0) {
        console.log(resumeIn);
        setTimeout(async () => res(await countdown()), 800);
      } else
        res();
    });
  }

  async function start() {
    await countdown();
    tuner.init();
  }

  // Detect click outside browser or changing tabs (instead of visibilitychange which just detects tab changes)
  window.addEventListener('blur', ev => {
    tuner.stopRecord();
    resumeIn = 3;
  });

  $: localStorage.transpose = transpose;
</script>

<!-- Consider using https://github.com/0xfe/vexflow or https://www.verovio.org/index.xhtml for rendering music -->
<main class="perfect-center">
  <Card>
    <ScrollingStaff currentPitch={currentPitch} paused={resumeIn !== -1} />
  </Card>
  <div class="overlay perfect-center" on:click={start} style={`display:${resumeIn === -1 ? "none" : ""}`}>
    {#if resumeIn === 3}
      Paused. Click to resume.
      <!-- https://makingmusicmag.com/a-simple-guide-to-transposing/ -->
      <select bind:value={transpose} on:click|stopPropagation>
        <option value={0}>Concert (piano, flute)</option>
        <option value={2}>B♭ trumpet, clarinet</option>
        <option value={4}>A</option>
        <option value={14}>B♭ tenor sax</option>
        <option value={9}>E♭ saxophone</option>
      </select>
    {:else}
      Resuming in {resumeIn + 1}
    {/if}
  </div>
</main>

<style>
   main {
     text-align: center;
     padding: 0.5em;
     max-width: 848px;
     margin: 0 auto;
   }

   .perfect-center {
     display: flex;
     justify-content: center;
     height: 100vh;
     align-items: center;
     flex-direction: column;
   }

   .overlay {
     position: fixed;
     width: 100vw;
     height: 100vh;
     color: white;
     cursor: zoom-out;
     background-color: rgba(0, 0, 0, 50%);
   }
</style>
