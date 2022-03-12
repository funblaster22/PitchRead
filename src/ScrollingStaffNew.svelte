<script lang="ts">
    import {onMount} from "svelte";
    // I added a `export default Vex` to the d.ts file
    // useful examples: http://www.vexflow.com/build/docs/note.html & https://github.com/0xfe/vexflow/wiki/Tutorial
    // TODO: for some reason the typing on this module is funky
    // Also considering https://www.verovio.org/index.xhtml, but the docs are lacking
    import Vex from "vexflow";

    let musicStaff: HTMLElement;

    // I want ScrollingStaff to do something like this: https://jsfiddle.net/stevenkaspar/8gLbetyy/
    // Relates to this issue: https://github.com/0xfe/vexflow/issues/544
    onMount(() => {
        // Basic setup boilerplate for using VexFlow with the SVG rendering context:
        VF = Vex.Flow;

        // Create an SVG renderer and attach it to the DIV element named "boo".
        var div = document.getElementById("boo")
        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(500, 500);
        var context = renderer.getContext();

        // A tickContext is required to draw anything that would be placed
        // in relation to time/rhythm, including StaveNote which we use here.
        // In real music, this allows VexFlow to align notes from multiple
        // voices with different rhythms horizontally. Here, it doesn't do much
        // for us, since we'll be animating the horizontal placement of notes,
        // but we still need to add our notes to a tickContext so that they get
        // an x value and can be rendered.
        //
        // If we create a voice, it will automatically apply a tickContext to our
        // notes, and space them relative to each other based on their duration &
        // the space available. We definitely do not want that here! So, instead
        // of creating a voice, we handle that part of the drawing manually.
        var tickContext = new VF.TickContext();

        // Create a stave of width 10000 at position 10, 40 on the canvas.
        var stave = new VF.Stave(10, 10, 10000)
            .addClef('treble');

        // Connect it to the rendering context and draw!
        stave.setContext(context).draw();

        var durations = ['8', '4', '2', '1'];

        var notes = [
            ['c', '#', '4'],
            ['e', 'b', '5'],
            ['g', '', '5'],
            ['d', 'b', '4'],
            ['b', 'bb', '3'],
            ['a', 'b', '4'],
            ['f', 'b', '5'],
        ].map(([letter, acc, octave]) => {
            const note = new VF.StaveNote({
                clef: 'treble',
                keys: [`${letter}${acc}/${octave}`],
                duration: durations[Math.floor(Math.random() * durations.length)],
            })
                .setContext(context)
                .setStave(stave);

            // If a StaveNote has an accidental, we must render it manually.
            // This is so that you get full control over whether to render
            // an accidental depending on the musical context. Here, if we
            // have one, we want to render it. (Theoretically, we might
            // add logic to render a natural sign if we had the same letter
            // name previously with an accidental. Or, perhaps every twelfth
            // note or so we might render a natural sign randomly, just to be
            // sure our user who's learning to read accidentals learns
            // what the natural symbol means.)
            if (acc) note.addAccidental(0, new VF.Accidental(acc));
            tickContext.addTickable(note)
            return note;
        });

        // The tickContext.preFormat() call assigns x-values (and other
        // formatting values) to notes. It must be called after we've
        // created the notes and added them to the tickContext. Or, it
        // can be called each time a note is added, if the number of
        // notes needed is not known at the time of bootstrapping.
        //
        // To see what happens if you put it in the wrong place, try moving
        // this line up to where the TickContext is initialized, and check
        // out the error message you get.
        //
        // tickContext.setX() establishes the left-most x position for all
        // of the 'tickables' (notes, etc...) in a context.
        tickContext.preFormat().setX(400);

        // This will contain any notes that are currently visible on the staff,
        // before they've either been answered correctly, or plumetted off
        // the staff when a user fails to answer them correctly in time.
        // TODO: Add sound effects.
        const visibleNoteGroups = [];

        // Add a note to the staff from the notes array (if there are any left).
        document.getElementById('add-note').addEventListener('click', (e) => {
            note = notes.shift();
            if (!note) return;
            const group = context.openGroup();
            visibleNoteGroups.push(group);
            note.draw();
            context.closeGroup();
            group.classList.add('scroll');
            // Force a dom-refresh by asking for the group's bounding box. Why? Most
            // modern browsers are smart enough to realize that adding .scroll class
            // hasn't changed anything about the rendering, so they wait to apply it
            // at the next dom refresh, when they can apply any other changes at the
            // same time for optimization. However, if we allow that to happen,
            // then sometimes the note will immediately jump to its fully transformed
            // position -- because the transform will be applied before the class with
            // its transition rule.
            const box = group.getBoundingClientRect();
            group.classList.add('scrolling');

            // If a user doesn't answer in time make the note fall below the staff
            window.setTimeout(() => {
                const index = visibleNoteGroups.indexOf(group);
                if (index === -1) return;
                group.classList.add('too-slow');
                visibleNoteGroups.shift();
            }, 5000);
        });

        // If a user plays/identifies the note in time, send it up to note heaven.
        document.getElementById('right-answer').addEventListener('click', (e) => {
            group = visibleNoteGroups.shift();
            group.classList.add('correct');
            // The note will be somewhere in the middle of its move to the left -- by
            // getting its computed style we find its x-position, freeze it there, and
            // then send it straight up to note heaven with no horizontal motion.
            const transformMatrix = window.getComputedStyle(group).transform;
            // transformMatrix will be something like 'matrix(1, 0, 0, 1, -118, 0)'
            // where, since we're only translating in x, the 4th property will be
            // the current x-translation. You can dive into the gory details of
            // CSS3 transform matrices (along with matrix multiplication) if you want
            // at http://www.useragentman.com/blog/2011/01/07/css3-matrix-transform-for-the-mathematically-challenged/
            const x = transformMatrix.split(',')[4].trim();
            // And, finally, we set the note's style.transform property to send it skyward.
            group.style.transform = `translate(${x}px, -800px)`;
        })
    });
</script>

<div id="staff" bind:this={musicStaff}>
</div>
<div id="controls">
    <button id='add-note'>Add Note</button>
    <button id='right-answer'>Right Answer</button>
</div>

<style global>
    .scroll {
        transition: transform 5s linear, opacity 0.5s ease-out, fill 0.2s linear;
    }

    .scrolling {
        transform: translate(-400px, 0);
    }

    .correct {
        opacity: 0;
    }

    .too-slow {
        transform: translate(-400px, 2000px);
    }
</style>