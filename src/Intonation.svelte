<script lang="ts">
// Domain: [-50, 50]
export let cents: number;

// green
const minHue = 120;
// red
const maxHue = 0;
const hueRange = maxHue - minHue;
</script>

<div class="indicator" style={"background-color: hsl(" + Math.round((Math.abs(cents)) / 50 * hueRange + minHue) + ", 100%, 50%); top:" + (cents + 50) + "vh"}></div>

<style>
    .indicator {
        position: fixed;
        left: 0;
        width: 100vw;
        height: 4vh;
        border-radius: 0.5vw;
        transition: top 100ms;
    }
</style>