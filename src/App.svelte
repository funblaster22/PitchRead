<script lang="ts">
  import Card from "./lib/Card.svelte";
  import Tuner from "./tuner";
  const tuner = new Tuner(440);
  tuner.onNoteDetected = console.log;
</script>

<!-- Consider using https://github.com/0xfe/vexflow or https://www.verovio.org/index.xhtml for rendering music -->
<main>
  <Card>
    I have sentience, please don't kill the runtime!
    <button on:click={tuner.init.bind(tuner)}>Start</button>
  </Card>
</main>

<style>
   main {
     text-align: center;
     padding: 0.5em;
     max-width: 848px;
     margin: 0 auto;

     /* Perfect centering */
     display: flex;
     justify-content: center;
     height: 100vh;
     align-items: center;
   }
</style>
