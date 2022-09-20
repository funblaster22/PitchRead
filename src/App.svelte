<script lang="ts">
  import Card from "./lib/Card.svelte";
  import Tuner, {noteStrings} from "./tuner";
  import ScrollingStaff from "./ScrollingStaff.svelte";
  import type {Clef, Pitch} from "./lib/types";
  import {writable} from "svelte/store";
  import Intonation from "./Intonation.svelte";
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
  let bpm = writable(Number.parseInt(localStorage.bpm) || 60);
  let waitCorrect = (localStorage.waitCorrect === "true") || false;
  let showNames = (localStorage.showNames === "true") || false;
  let accidentals = JSON.parse(localStorage.getItem("accidentals")) || ["", "b", "#"];
  let clef: Clef = localStorage.clef || "treble";
  let accuracy = 0;
  let keySig = localStorage.keySig || "C";

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

  async function start(ev: MouseEvent) {
    if (ev.target === ev.currentTarget) {  // TODO: why do I need this check?
      await countdown();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#eee');
      tuner.init();
    }
  }

  function pause() {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#777');
    tuner.stopRecord();
    resumeIn = 3;
  }

  // Detect click outside browser or changing tabs (instead of visibilitychange which just detects tab changes)
  window.addEventListener("blur", pause);
  window.addEventListener("message", msg => {
    if (location.origin === msg.origin) {
      console.log("KEYSIG", msg.data);
      keySig = msg.data as string;
      location.reload(); // TODO: requestAnimationFrame or IdleCallback if not committing to localStorage
    }
  });

  $: localStorage.transpose = transpose;
  $: localStorage.bpm = $bpm;
  $: localStorage.waitCorrect = waitCorrect;
  $: localStorage.showNames = showNames;
  $: localStorage.accidentals = JSON.stringify(accidentals);
  // Special cases, must reload. Easiest way (otherwise basically have to rerender entire stave)
  $: localStorage.clef = clef;
  $: localStorage.keySig = keySig;
</script>

<!-- Consider using https://github.com/0xfe/vexflow or https://www.verovio.org/index.xhtml for rendering music -->
<main class="perfect-center">
  <div id="scores">
    Speed: {$bpm} bpm<br />
    Accuracy: {accuracy}%<br />
    Pitch: {currentPitch.cents || 0}¢
    {#if showNames}
      <br />
      Playing note: {currentPitch.name || "none"}
    {/if}
  </div>
  <div id="pause">
    {#if resumeIn === 3}
      <button on:click={start}>▶️</button>
    {:else}
      <button on:click={pause}>⏸️</button>
    {/if}
  </div>
  <Card>
    <ScrollingStaff currentPitch={currentPitch} paused={resumeIn !== -1} {accidentals} {clef} {bpm} {waitCorrect} {showNames} {keySig} on:note={ev => accuracy = ev.detail} />
  </Card>
  <Intonation cents={currentPitch.cents} />
  <div class="overlay" on:click={start} style={`overflow: hidden auto; display:${resumeIn < 0 ? "none" : ""}`}>
    {#if resumeIn === 3}
        <p>Paused. Click to resume.</p>
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
        <label>
          <input type="checkbox" bind:checked={waitCorrect} />
          Wait for correct note
        </label>
        <label>
          BPM:
          <input type="range" bind:value={$bpm} min="1" max="200" disabled={waitCorrect} />
          <input bind:value={$bpm} type="number" min="1" max="200" disabled={waitCorrect} />
        </label>
        <label>
          <input type="checkbox" bind:checked={showNames} />
          Show note names
        </label>
        <hr class="constrained-fluid-width" />
        <ul on:click={location.reload.bind(location)}>
          <li><label><input type="radio" bind:group={clef} value="treble">Treble clef</label></li>
          <li><label><input type="radio" bind:group={clef} value="bass">Bass clef</label></li>
        </ul>
        <ul>
          <li><label><input type="checkbox" bind:group={accidentals} value="">Nothing</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="n">Naturals</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="#">Sharps</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="b">Flats</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="##">Double sharps</label></li>
          <li><label><input type="checkbox" bind:group={accidentals} value="bb">Double flats</label></li>
        </ul>
        <label>Lowest note:</label>
        <label>Highest note:</label>
        <label>Key signature: {keySig}</label>
        <!-- TODO: use embed or object? With object I can include a fallback, but I'm targeting modern browsers anyways. Both support scripting -->
        <embed type="image/svg+xml" src="fifths-circle.svg" class="constrained-fluid-width" />
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
    width: min-content;
    margin-left: auto;
    margin-right: auto;
    white-space: nowrap;
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
    z-index: 1000;
  }
  
  .constrained-fluid-width {
    width: 100vw;
    max-width: 20em;
  }

  #scores {
    position: fixed;
    top: 0;
    right: 0;
    padding-right: 1em;
    text-align: right;
  }

  #pause {
    position: fixed;
    top: 0;
    left: 0;
  }
</style>
