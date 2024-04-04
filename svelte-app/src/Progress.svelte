<script>
    export let scoring = {}; // Scoring hashmap replaces numerator and denominator
    let selectedIndex = null; // Reactive variable to store the index of the selected hexagon

    // Adjusted hexagon path to scale with the SVG size
    const hexagonPath = "M64,18l32,18v36l-32,18l-32,-18v-36l32,-18Z";
    function handleClick(index) {
        selectedIndex = index;
    }

    // Function to reset the selected index when another hexagon is clicked or when clicked again
    function handleMouseOut() {
        selectedIndex = null;
    }

    // Function to determine fill color based on score
    function fillColor(score) {
        switch(score) {
            case 0: return 'red';
            case 1: return 'orange';
            case 2: return 'yellow';
            case 3: return 'green';
            default: return 'lightgrey';
        }
    }
</script>

<style>
    .hexagon {
        transition: fill 0.3s ease;
    }
    .hexagon-container {
        display: flex;
        flex-wrap: wrap;
        width: fit-content;
        align-items: flex-start;
    }
    svg {
        margin: 0;
        margin-right: -96px;
    }
    svg:nth-child(odd) {
        transform: translateY(50px);
    }
    /* .hexagon-number {
        position: absolute;
        font-size: 2rem;
        left: 50%;
        top: 20px;
        transform: translateX(-50%);
        pointer-events: none;
    } */
</style>
<div class="hexagon-container">
    {#each Object.keys(scoring) as key, index}
        <svg 
            width="128" 
            height="144" 
            viewBox="0 0 128 144" 
            class="hexagon"
            style="fill: {fillColor(scoring[key])};"
            on:click={() => handleClick(index)}
            on:mouseout={handleMouseOut}
        >
            <path d="{hexagonPath}"/>
        </svg>
    {/each}
</div>

<!-- {#if selectedIndex !== null}
    <div class="hexagon-number">Hexagon {selectedIndex + 1}</div>
{/if} -->