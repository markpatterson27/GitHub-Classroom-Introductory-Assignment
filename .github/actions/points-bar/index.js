const core = require("@actions/core");

const fs = require("fs");


async function run() {
    try {
        const points = core.getInput("points");
        const path = core.getInput("path");

        const pointsParts = points.split("/");
        const percentage = Math.floor((pointsParts[0] / pointsParts[1]) * 100);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120px" height="36px">
        <title>Points: ${points}</title>
        <svg y="6px" height="16px" font-size="16px" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji" fill="#868E96">
          <text x="0" y="12">Points</text>
          <text x="120" y="12" text-anchor="end">${points}</text>
        </svg>
        <svg y="24" width="120px">
          <rect rx="3" width="100%" height="6" fill="#eee" />
          <rect rx="3" width="0%" height="6" fill="#0170f0">
            <animate attributeName="width" begin="0.5s" dur="600ms" from="0" to="${percentage}%" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1"/>
          </rect>
        </svg>
        </svg>`

        fs.writeFile(path, svg, function (err) {
            if (err) return console.log(err);
            console.log(`SVG bar > ${path}`);
        });

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
