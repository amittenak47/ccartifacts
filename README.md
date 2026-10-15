# ccartifacts

Interactive explainers on hyperbolic geometry, greedy routing, coloring the plane, frequency reuse, antenna interference and spacetime diagrams.

Every page is plain HTML with inline JavaScript. There is no build step and nothing to install: open `index.html` in a browser, or browse the site if GitHub Pages is turned on for this repo.

## Contents

| Folder | Page | What it shows |
| --- | --- | --- |
| `hyperbolic-routing-lab/` | `index.html` | The full lab: saddle and pseudosphere, Poincaré disk coordinates, Möbius maps and Kleinberg's tiling, a live re-run of Kleinberg's greedy routing experiment, the Poincaré ball, coloring flat and hyperbolic planes, frequency reuse on a hyperbolic tiling, and Shannon capacity versus cluster size |
| `hyperbolic-geometry/` | `tree-in-poincare-disk.html` | A tree embedded in the Poincaré disk |
| | `hyperboloid-to-poincare.html` | Projecting the hyperbola t² − x² = 1 to the unit interval, landing at tanh(r/2) |
| `plane-coloring/` | `hex-lattice-distances.html` | The √3, √4 and √7 lattice walks, and why only the 7-color hex pattern is a valid unit-distance coloring |
| | `two-steps-60-degree-turn.html` | The √3·d walk with its exterior and interior angles |
| `wireless-interference/` | `two-antenna-interference.html` | Peak and null hyperbolas from two antennas |
| `spacetime/` | `minkowski-to-penrose.html` | A Minkowski diagram squeezed into a Penrose diamond |
| | `focal-difference-antenna-vs-spacetime.html` | The constant distance difference on antenna and spacetime hyperbolas, compared |

`assets/widget.css` holds the shared colors and type for the smaller pages, with light and dark themes.

`hyperbolic-routing-lab/src/` has the lab's JavaScript as separate files for reading: `core.js` (complex numbers, Möbius maps, Kleinberg's embedding), `net.js` (random networks and the three routing schemes) and `ui.js` (the page). The lab's `index.html` already contains all of it inline.

## Simulation notes

The routing experiment follows the setup in Kleinberg's paper: 50 nodes placed uniformly in a circle of radius √5, links between nodes at most 1 apart, and a minimum spanning tree embedded in the hyperbolic plane. Greedy routing runs over all links. Results vary from run to run; typical numbers are about 7–10% Euclidean delivery failure, 0% hyperbolic failure, and 80th-percentile stretch near 1.25 (hyperbolic) versus 4.0 (tree path). The paper doesn't say how its spanning tree was rooted, so the lab roots it at the tree's center node.

## References

- R. Kleinberg, "Geographic Routing Using Hyperbolic Space," IEEE INFOCOM 2007.
- E. Izgorodin, "Semantic Level of Detail for Knowledge Graphs," GRAAI @ WCCI 2026 ([arXiv:2603.08965](https://arxiv.org/abs/2603.08965)).
- A. Cvetkovski and M. Crovella, "Hyperbolic Embedding and Routing for Dynamic Graphs," IEEE INFOCOM 2009.
- H. Parlier and C. Petit, "Chromatic numbers for the hyperbolic plane and discrete analogs" ([arXiv:1701.08648](https://arxiv.org/abs/1701.08648)).
- E. DeCorte and K. Golubev, "Lower bounds for the measurable chromatic number of the hyperbolic plane" ([arXiv:1708.01081](https://arxiv.org/abs/1708.01081)).
- OpenAI, "The Euclidean plane is not five-colorable," preprint, September 23, 2026 ([summary](https://www.emergentmind.com/openai-math-explorer/results/158)). Not yet peer reviewed.
