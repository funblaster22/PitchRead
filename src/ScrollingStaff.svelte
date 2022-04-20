<script lang="ts">
  import {createEventDispatcher, onMount} from "svelte";
    // useful examples: http://www.vexflow.com/build/docs/note.html & https://github.com/0xfe/vexflow/wiki/Tutorial
    // Also considering https://www.verovio.org/index.xhtml, but the docs are lacking
    import {Flow as VF, RenderContext, StaveNote} from "vexflow";
    import type {Clef} from "./lib/types.ts";
    import {Writable} from "svelte/store";

    // In the format <note><accidental>/<octave>, replacing the values in square brackets
    export let currentPitch: {name, value, cents, octave, frequency};
    export let paused = true;
    export let accidentals: string[];
    export let clef: Clef;
    export let bpm: Writable<number>;
    export let waitCorrect: boolean;

    const dispatch = createEventDispatcher();
    // if !waitCorrect:
    let accuracy: [number, number] = [0, 0];
    // else if waitCorrect:
    let startTime = performance.now();

    // Note should be formatted like: a#/4
    function synonym(note: string | undefined) {
        if (!note) return;
        const noteName = note.split('/')[0];
        const octave = Number.parseInt(note.at(-1));
        const flatToSharp = {
            'cb': 'b',
            'db': 'c#',
            'eb': 'd#',
            'fb': 'e',
            'gb': 'f#',
            'ab': 'g#',
            'bb': 'a#',
        };
        return (flatToSharp[noteName] || noteName) + "/" + (noteName === 'cb' ? octave - 1 : octave);
    }

    /** Get note name from MIDI value */
    function noteName(MIDIval: number): string | undefined {
        if (isNaN(MIDIval)) return;
        //return tuner.noteStrings[note % 12]
    }

    // Reference [this issue](https://github.com/0xfe/vexflow/issues/544), which proposes https://jsfiddle.net/stevenkaspar/8gLbetyy/
    // Adapted from https://jsfiddle.net/gristow/Ln76ysjv/
    namespace Controller {
      // region Constants
      const notes: StaveNote[] = [];

      // This will contain any notes that are currently visible on the staff,
      // before they've either been answered correctly, or plummeted off
      // the staff when a user fails to answer them correctly in time.
      // TODO: Add sound effects.
      export const visibleNoteGroups: SVGElement[] = [];

      // Create a stave of width 10000 at position 10, 40 on the canvas.
      const stave = new VF.Stave(10, 10, 10000)
        .addClef(clef as string);

      // A tickContext is required to draw anything that would be placed (x value)
      const tickContext = new VF.TickContext();
      // The tick context for the note that is currently being played (from mic)
      const playingTickContext = new VF.TickContext();
      // endregion

      // region Members (do not change once set)
      // Readonly
      export let musicStaff: HTMLDivElement;
      let context: RenderContext;
      // Readonly
      export let playingNoteGroup: SVGGElement;
      //endregion

      export function init() {
        // Create an SVG renderer and attach it to the DIV element
        const renderer = new VF.Renderer(musicStaff, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(401, 125);
        context = renderer.getContext();

        // Connect it to the rendering context and draw!
        stave.setContext(context).draw();

        const playingNote = new VF.StaveNote({
          clef: 'treble',
          keys: [`a/4`],
          duration: '1',
        })
          .setContext(context)
          .setStave(stave);

        playingTickContext.addTickable(playingNote);
        playingTickContext.preFormat().setX(0);
        playingNoteGroup = context.openGroup() as SVGGElement;
        playingNote.draw();
        context.closeGroup();
        playingNoteGroup.classList.add("playingNote")
      }

      function makeNote([letter, acc, octave]) {
        //console.log(`${letter}${acc}/${octave}`);
        const durations = ['8', '4', '2', '1'];
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
        if (acc) note.addModifier(new VF.Accidental(acc));
        tickContext.addTickable(note);
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
        tickContext.preFormat().setX(400);  // Necessary on every call to avoid 'unformatted note' errors
        return note;
      }

      // Add a note to the staff from the notes array (if there are any left).
      export function addNote() {
        // TODO: right now, none of them work
        const acc = accidentals[Math.floor(Math.random() * accidentals.length)];
        const details = [(Math.floor(Math.random() * 7) + 10).toString(36), acc, Math.floor(Math.random() * 2) + 4];
        notes.push(makeNote(details));
        const note = notes.shift();
        if (!note) return;
        const group = context.openGroup() as SVGGElement;
        visibleNoteGroups.push(group);
        note.draw();
        context.closeGroup();
        group.dataset.notename = details[0] + details[1] + "/" + details[2]
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
        if (!waitCorrect) {
          window.setTimeout(() => {
            const index = visibleNoteGroups.indexOf(group);
            if (index === -1) return;
            group.classList.add('too-slow');
            if (!paused)
              accuracy[1]++;
            dispatch("note", Math.round(accuracy[0] / accuracy[1] * 1000) / 10);
            visibleNoteGroups.shift();
            setTimeout(() => group.remove(), 5000);
          }, 5000);
          /*playingNote.addAccidental(0, new VF.Accidental(acc));
          playingTickContext.preFormat().setX(0);
          playingNote.draw();  // TODO: seems like the best way to do this involves creating a group*/
        }
        repositionNotes();
      }

      /** Moves all displayed notes if wait until correct setting enabled */
      function repositionNotes() {
        if (waitCorrect) {
          visibleNoteGroups.forEach((group, i) => {
            // move by 80 pixels each time
            group.style.transform = `translate(${-400 + 80 * i}px, 0)`;
          });
        }
      }

      // If a user plays/identifies the note in time, send it up to note heaven.
      export function rightAnswer() {
        const group = visibleNoteGroups.shift();
        group.classList.add('correct');
        accuracy[0]++;
        accuracy[1]++;
        if (waitCorrect) {
          addNote();
          $bpm = Math.round(accuracy[1] / ((performance.now() - startTime) / (60 * 1000)));
        }
        dispatch("note", Math.round(accuracy[0] / accuracy[1] * 1000) / 10);
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
        setTimeout(() => group.remove(), 5000);
      }

      export function check() {

      }
    }

    // 69 is the value of a4
    // TODO: because increments between notes are not uniform (e,f & b,c) it can get off but should be fine for now
    $: if (Controller.playingNoteGroup) Controller.playingNoteGroup.style.transform = "translateY(" + (69 - currentPitch.value) * 2.5 + "px)";
    $: if (paused) pause(); else resume();
    $: {
      console.log("CHECKING", synonym(Controller.visibleNoteGroups[0]?.dataset?.notename), "against", currentPitch?.name?.toLowerCase() + "/" + currentPitch.octave);
      if (currentPitch?.name?.toLowerCase() + "/" + currentPitch.octave === synonym(Controller.visibleNoteGroups[0]?.dataset?.notename))
        Controller.rightAnswer();
    }

    let animateInterval: number;
    function resume() {
      //Controller.check();
      startTime = performance.now();
      if (!waitCorrect)
        animateInterval = window.setInterval(Controller.addNote, 60 / $bpm * 1000);
      else
        for (let i = 0; i < 5; i++)
          Controller.addNote();
      /* This should work, but it doesn't
      navigator.mediaDevices.getUserMedia({audio: true}).then(stream =>
        stream.getAudioTracks().forEach(track => track.enabled = true)
      );*/
    }
    function pause() {
      clearInterval(animateInterval);
      Controller.visibleNoteGroups.forEach(group => group.remove());
    }


    onMount(Controller.init);
</script>

<div id="staff" bind:this={Controller.musicStaff}>
    <g class="vf-stavenote" id="vf-auto8132"><g class="vf-note" pointer-events="bounding-box">
        <g class="vf-notehead" pointer-events="bounding-box">
            <path stroke-width="0.3" fill="black" stroke="none" stroke-dasharray="none" d="M453 105M453 104.91576C453 107.63952,455.30256 110.0544,461.33976 110.0544C467.96664 110.0544,470.07264 107.75184,470.07264 104.91576C470.07264 102.0516,465.4956 99.9456,461.73288 99.9456C456.3696 99.9456,453 102.16392,453 104.91576M457.38048 103.42752C457.38048 103.09056,457.40856 102.78168,457.4928 102.44472C457.94208 101.04072,459.43032 100.84416,460.69392 100.84416C463.47384 100.84416,465.69216 103.82064,465.69216 106.2636C465.69216 107.49912,465.15864 108.6504,463.83888 108.95928C463.44576 109.0716,462.99648 109.12776,462.57528 109.12776C461.11512 109.12776,459.62688 108.14496,458.78448 107.02176C457.97016 106.09512,457.38048 104.7192,457.38048 103.42752"></path>
        </g>
    </g>
        <g class="vf-modifiers"></g>
    </g>
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

    .playingNote {
        transition: transform 100ms linear;
    }
</style>