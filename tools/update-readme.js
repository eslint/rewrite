/**
 * @fileoverview Script to update the README with sponsors details in all packages.
 *
 *   node tools/update-readme.js
 *
 * @author Harish Kumar S S
 */

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { stripIndents } from "common-tags";
import got from "got";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const SPONSORS_URL =
	"https://raw.githubusercontent.com/eslint/eslint.org/main/src/_data/sponsors.json";

const README_FILE_PATHS = [
	"./README.md",
	...readdirSync("./packages").map(dir => `./packages/${dir}/README.md`),
];

const heights = {
	gold: 96,
	silver: 64,
	bronze: 32,
};

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Fetches the latest sponsors data from the website.
 * @returns {Object} The sponsors data object.
 */
async function fetchSponsorsData() {
	const data = await got(SPONSORS_URL).json();

	// remove backers from sponsors list - not shown on readme
	delete data.backers;

	return data;
}

/**
 * Formats an array of sponsors into HTML for the readme.
 * @param {Array} sponsors The array of sponsors.
 * @returns {string} The HTML for the readme.
 */
function formatSponsors(sponsors) {
	const nonEmptySponsors = Object.keys(sponsors).filter(
		tier => sponsors[tier].length > 0,
	);

	return stripIndents`<!--sponsorsstart-->
        ${nonEmptySponsors
			.map(
				tier => `<h3>${tier[0].toUpperCase()}${tier.slice(1)} Sponsors</h3>
            <p>${sponsors[tier]
				.map(
					sponsor =>
						`<a href="${sponsor.url || "#"}"><img src="${sponsor.image}" alt="${sponsor.name}" height="${heights[tier]}"></a>`,
				)
				.join(" ")}</p>`,
			)
			.join("")}
    <!--sponsorsend-->`;
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

(async () => {
	const allSponsors = await fetchSponsorsData();

	README_FILE_PATHS.forEach(filePath => {
		// read readme file
		const readme = readFileSync(filePath, "utf8");

		let newReadme = readme.replace(
			/<!--sponsorsstart-->[\w\W]*?<!--sponsorsend-->/u,
			formatSponsors(allSponsors),
		);

		// replace multiple consecutive blank lines with just one blank line
		newReadme = newReadme.replace(/(?<=^|\n)\n{2,}/gu, "\n");

		// output to the files
		writeFileSync(filePath, newReadme, "utf8");
	});
})();
