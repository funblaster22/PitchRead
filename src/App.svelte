<script lang="ts">
  import Card from "./lib/Card.svelte";
  import Tuner from "./tuner";
  import ScrollingStaff from "./ScrollingStaffNew.svelte";
  const tuner = new Tuner(440);
  let currentPitch = 440;
  tuner.onNoteDetected = note => currentPitch = note;
  const dispatcher = new EventTarget();

  // Seconds until the game resumes. -1 means indefinitely
  let resumeIn = 3;

  // Why does this feel like REALLY bad design?
  async function countdown() {
    return new Promise<void>(res => {
      if (resumeIn-- > 0) {
        console.log(resumeIn);
        setTimeout(async () => res(await countdown()), 1000);
      } else
        res();
    });
  }

  async function start() {
    await countdown();
    tuner.init();
    dispatcher.dispatchEvent(new Event("resume"))
  }
</script>

<!-- Consider using https://github.com/0xfe/vexflow or https://www.verovio.org/index.xhtml for rendering music -->
<main class="perfect-center">
  <Card>
    <ScrollingStaff a4={440} currentPitch={currentPitch} events={dispatcher} />
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
