<script>
    export let numerator = 0;
    export let denominator = 5;
  
    // Adjusted hexagon path to scale with the SVG size
    const hexagonPath = "M64,18l32,18v36l-32,18l-32,-18v-36l32,-18Z";
  </script>
  
  <style>
    .hexagon {
      fill: lightgrey;
      transition: fill 0.3s ease;
    }
    .filled {
      fill: darkgrey;
    }
    .hexagon-container {
      display: flex;
      flex-wrap: wrap;
      width: fit-content;
      /* Adjust the alignment for a tight honeycomb pattern */
      align-items: flex-start;
    }
    svg {
      /* Remove margin to eliminate spacing */
      margin: 0;
      /* Adjust for honeycomb pattern overlap */
      margin-right: -96px; /* Adjust based on actual size and desired overlap */
    }
    /* Adjust every odd hexagon to fit tightly in a honeycomb pattern */
    svg:nth-child(odd) {
      /* Offset odd hexagons to interlock with the even ones */
      transform: translateY(50px);
    }
  </style>
  
  <div class="hexagon-container">
    {#each Array(denominator) as _, index}
      <svg width="128" height="144" viewBox="0 0 128 144" class="hexagon {index < numerator ? 'filled' : ''}">
        <path d="{hexagonPath}"/>
      </svg>
    {/each}
  </div>