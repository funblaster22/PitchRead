<script lang="ts">
  import Card from "./lib/Card.svelte";
  import Tuner from "./tuner";
  import ScrollingStaff from "./ScrollingStaff.svelte";
  const tuner = new Tuner(440);
  let currentPitch = 440;
  tuner.onNoteDetected = note => currentPitch = note;

  // Seconds until the game resumes. -1 means playing, 3 is indefinitely
  let resumeIn = 3;

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
</script>

<!-- Consider using https://github.com/0xfe/vexflow or https://www.verovio.org/index.xhtml for rendering music -->
<main class="perfect-center">
  <Card>
    <ScrollingStaff currentPitch={currentPitch} paused={resumeIn !== -1} />
  </Card>
  <div class="overlay perfect-center" on:click={start} style={`display:${resumeIn === -1 ? "none" : ""}`}>
    {#if resumeIn === 3}
      Paused. Click to resume.
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
