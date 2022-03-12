<script lang="ts">
    import {onMount} from "svelte";
    // I added a `export default Vex` to the d.ts file
    // useful examples: http://www.vexflow.com/build/docs/note.html & https://github.com/0xfe/vexflow/wiki/Tutorial
    // TODO: for some reason the typing on this module is funky
    // Also considering https://www.verovio.org/index.xhtml, but the docs are lacking
    import Vex from "vexflow";

    let musicStaff: HTMLDivElement;

    // I want ScrollingStaff to do something like this: https://jsfiddle.net/stevenkaspar/8gLbetyy/
    // Relates to this issue: https://github.com/0xfe/vexflow/issues/544
    onMount(() => {
        const VF = Vex.Flow;

        // Create an SVG renderer and attach it to the DIV element named "boo".
        const renderer = new VF.Renderer(musicStaff, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(401, 125);
        const context = renderer.getContext();
        context.setFont("Arial", 10).setBackgroundFillStyle("#eed");

        // Create a stave of width 400 at position 10, 40 on the canvas.
        const stave = new VF.Stave(0, 0, 400);

        // Add a clef and time signature.
        stave.addClef("treble").addTimeSignature("4/4");

        // Connect it to the rendering context and draw!
        stave.setContext(context).draw();

        // Create the notes
        const notes = [
            // A quarter-note C.
            new VF.StaveNote({keys: ["c/4"], duration: "q"}),

            // A quarter-note D.
            new VF.StaveNote({keys: ["d/4"], duration: "q"}),

            // A quarter-note rest. Note that the key (b/4) specifies the vertical
            // position of the rest.
            new VF.StaveNote({keys: ["b/4"], duration: "qr"}),

            // A C-Major chord.
            new VF.StaveNote({keys: ["c/4", "e/4", "g/4"], duration: "q"})
        ];

        // Create a voice in 4/4 and add above notes
        const voice = new VF.Voice({num_beats: 4,  beat_value: 4});
        voice.addTickables(notes);

        // Format and justify the notes to 400 pixels.
        const formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);

        // Render voice
        voice.draw(context, stave);
    });
</script>

<div id="staff" bind:this={musicStaff}></div>

<style>
</style>