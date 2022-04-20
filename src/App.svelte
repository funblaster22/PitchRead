<script lang="ts">
  import Card from "./lib/Card.svelte";
  import Tuner, {noteStrings} from "./tuner";
  import ScrollingStaff from "./ScrollingStaff.svelte";
  import type {Clef, Pitch} from "./lib/types";
  const tuner = new Tuner(440);
  let currentPitch: Partial<Pitch> = {};
  tuner.onNoteDetected = (note: Pitch) => {
    note.value += transpose;
    note.name = noteStrings[note.value % 12];
    note.octave = Math.floor(note.value / 12) - 1;
    currentPitch = note;
  }

  // Seconds until the game resumes. -1 means playing, 3 is indefinitely
  let resumeIn = 3;
  let transpose = Number.parseInt(localStorage.transpose) || 0;
  let bpm = Number.parseInt(localStorage.bpm) || 60;
  let waitCorrect = (localStorage.waitCorrect === "true") || false;
  let accidentals = JSON.parse(localStorage.getItem("accidentals")) || ["", "b", "#"];
  let clef: Clef = localStorage.clef || "treble";

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

  function pause() {
    tuner.stopRecord();
    resumeIn = 3;
  }

  // Detect click outside browser or changing tabs (instead of visibilitychange which just detects tab changes)
  window.addEventListener('blur', pause);

  $: localStorage.transpose = transpose;
  $: localStorage.bpm = bpm;
  $: localStorage.waitCorrect = waitCorrect;
  $: localStorage.accidentals = JSON.stringify(accidentals);
  $: localStorage.clef = clef;
</script>

<!-- Consider using https://github.com/0xfe/vexflow or https://www.verovio.org/index.xhtml for rendering music -->
<main class="perfect-center">
  <div id="scores">
    Speed: {bpm} bpm<br />
    Accuracy: 0%
  </div>
  <div id="pause">
    <button on:click={pause}>⏸️</button>
  </div>
  <Card>
    <ScrollingStaff currentPitch={currentPitch} paused={resumeIn !== -1} {accidentals} {clef} />
  </Card>
  <div class="overlay perfect-center" on:click={start} style={`display:${resumeIn === -1 ? "none" : ""}`}>
    {#if resumeIn === 3}
      Paused. Click to resume.
      <div on:click|stopPropagation>
        <!-- https://makingmusicmag.com/a-simple-guide-to-transposing/ -->
        <select bind:value={transpose}>
          <option value={0}>Concert (piano, flute)</option>
          <option value={12}>Concert +1 octave</option>
          <option value={2}>B♭ trumpet, clarinet</option>
          <option value={4}>A</option>
          <option value={14}>B♭ tenor sax</option>
          <option value={9}>E♭ saxophone</option>
        </select><br />
        <label>
          Transpose half-steps:
          <input type="number" min="-48" max="48" bind:value={transpose} />
        </label>
        <hr />
        <ul>
          <li><label><input type="radio" bind:group={clef} value="treble">Treble clef</label></li>
        </ul>
        <ul>
          <li><label><input type="checkbox" bind:group={accidentals} value="">Naturals</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="#">Sharps</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="b">Flats</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="##">Double sharps</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="bb">Double flats</label></li>
        </ul>
      </div>
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

   ul {
     list-style: none;
     padding: 0;
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

   #scores {
     position: fixed;
     top: 0;
     right: 0;
   }

   #pause {
     position: fixed;
     top: 0;
     left: 0;
   }
</style>
