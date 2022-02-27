<script lang="ts">
  import Card from "./lib/Card.svelte";
</script>

<main>
  <Card>I have sentience, please don't kill the runtime!</Card>
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
