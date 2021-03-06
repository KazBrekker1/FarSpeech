let DialectLabels = {
	ALG: "Algeria",
	EGY: "Egypt",
	IRA: "Iraq",
	JOR: "Jordan",
	KSA: "Saudi Arabia",
	KUW: "Kuwait",
	LEB: "Lebanon",
	LIB: "Libya",
	MAU: "Mauritania",
	MOR: "Morocco",
	OMA: "Oman",
	PAL: "Palestine",
	QAT: "Qatar",
	SUD: "Sudan",
	SYR: "Syria",
	UAE: "United Arab Emirates",
	YEM: "Yemen",
};

let sessionText = {
	Raw: "Oops!. An Error Happened",
	Translated: "Oops!. An Error Happened",
	Segmented: "Oops!. An Error Happened",
	Diactrized: "Oops!. An Error Happened",
	partsOfSpeach: "Oops!. An Error Happened",
	Dialects: "Oops!. An Error Happened",
};

let myModal = new bootstrap.Modal(document.getElementById("openingModal"), {
	keyboard: false,
});

// ==== Helper Functions / Functions' Declaration ==== //
// Changes the dropdown list's arrow according to the screen size
// Hides Diac List and Segmentation block for Map and POS to be the default
let screenCheck = () => {
	$(".segmentation").attr("hidden", true);
	$(".diacList").attr("hidden", true);
	if ($(window).width() < 768) {
		// console.log("This Is Phone");
		$(".tools").removeClass("dropdown");
		$(".tools").addClass("dropup");
	}
};

// Saves the Text Spoken to a .txt file as a json object
let saveSession = (text) => {
	let value = JSON.stringify(text, null, 2);
	let blob = new Blob([value], { type: "text/plain;charset=utf-8" });
	saveAs(blob, "Raw.txt");
};

// ==== Action Handlers ==== //
// Handles the Buffer-Text's Visibility and the .mapcontainer's interactivity
let bufferTextSwitch = (bool) => {
	$(".mapcontainer").css({
		"pointer-events": bool ? "none" : "all",
	});
	$(".map").css({
		opacity: bool ? 0.3 : 1,
	});
	$(".buffer-text").css({
		opacity: bool ? 1 : 0,
		"z-index": bool ? 10 : -1,
	});
};

// Toggling Between Map and List
let hidden = false;
let handleContainerView = () => {
	$(".diacList").attr("hidden", hidden);
	$(".map").attr("hidden", !hidden);
	hidden = !hidden;
};

let choice = false;
let handleBoxView = () => {
	$(".segmentation").attr("hidden", choice);
	$(".parts-of-speach").attr("hidden", !choice);
	choice = !choice;
};

let saveSessionHandler = () => {
	saveSession(sessionText);
};

// ==== Map / List Updating ==== //
// Updates The Map And The List
let updateMapAndList = (info) => {
	let sortable = [];
	for (let dialect in info[0]["final_score"]) {
		sortable.push([dialect, info[0]["final_score"][dialect]]);
	}

	sortable.sort(function (a, b) {
		return b[1] - a[1];
	});

	// Turns the buffer-text div off
	bufferTextSwitch(false);

	// List Updating
	topX = sortable.slice(0, 4);

	sessionText.Dialects = `1st.[${DialectLabels[topX[0][0]]} ${
		topX[0][1] * 100
	}%] 2nd.[${DialectLabels[topX[1][0]]} ${topX[1][1] * 100}%] 3rd.[${
		DialectLabels[topX[2][0]]
	} ${topX[2][1] * 100}%] 4th.[${DialectLabels[topX[3][0]]} ${
		topX[3][1] * 100
	}%]`;

	$(".perc-1")
		.empty()
		.append(
			`<h4>${
				DialectLabels[topX[0][0]]
			}</h4><span class="badge bg-primary rounded-pill p-2">${(
				topX[0][1] * 100
			).toPrecision(3)} %</span>`
		);
	$(".perc-2")
		.empty()
		.append(
			`<h4>${
				DialectLabels[topX[1][0]]
			}</h4><span class="badge bg-primary rounded-pill p-2">${(
				topX[1][1] * 100
			).toPrecision(3)} %</span>`
		);
	$(".perc-3")
		.empty()
		.append(
			`<h4>${
				DialectLabels[topX[2][0]]
			}</h4><span class="badge bg-primary rounded-pill p-2">${(
				topX[2][1] * 100
			).toPrecision(3)} %</span>`
		);
	$(".perc-4")
		.empty()
		.append(
			`<h4>${
				DialectLabels[topX[3][0]]
			}</h4><span class="badge bg-primary rounded-pill p-2">${(
				topX[3][1] * 100
			).toPrecision(3)} %</span>`
		);

	// console.log(sortable); // This Containes the Countries Sorted Out
	dialectHistory.push(sortable[0][0]);

	let dialectFreq = (function () {
		/* Below is a regular expression that finds alphanumeric characters
							 Next is a string that could easily be replaced with a reference to a form control
							 Lastly, we have an array that will hold any words matching our pattern */
		// var pattern = /\w+/g,
		//     string = "I I am am am yes yes.",
		//     matchedWords = string.match( pattern );

		/* The Array.prototype.reduce method assists us in producing a single value from an
							 array. In this case, we're going to use it to output an object with results. */
		let counts = dialectHistory.reduce(function (stats, word) {
			/* `stats` is the object that we'll be building up over time.
									 `word` is each individual entry in the `dialectHistory` array */
			if (stats.hasOwnProperty(word)) {
				/* `stats` already has an entry for the current `word`.
											 As a result, let's increment the count for that `word`. */
				stats[word] = stats[word] + 1;
			} else {
				/* `stats` does not yet have an entry for the current `word`.
											 As a result, let's add a new entry, and set count to 1. */
				stats[word] = 1;
			}

			/* Because we are building up `stats` over numerous iterations,
									 we need to return it for the next pass to modify it. */
			return stats;
		}, {});

		/* Now that `counts` has our object, we can log it. */
		return counts;
	})();

	let max_freq = 0;
	let dialectWithHighestFreq = "";
	Object.keys(dialectFreq).forEach(function (key, index) {
		console.log(key, dialectFreq[key]);
		if (dialectFreq[key] > max_freq) {
			max_freq = dialectFreq[key];
			dialectWithHighestFreq = key;
		}

		// key: the name of the object key
		// index: the ordinal position of the key within the object
	});

	let probabilityOfMainDialect = (max_freq / dialectHistory.length) * 100;

	Object.keys($mapcontainer.data("mapael").areas).forEach(function (
		key,
		index
	) {
		if (countriesOfDialect[sortable[0][0]].indexOf(key) > -1) {
			if (sortable[0][0] === "MSA") {
				updatedOptions.areas[key] = {
					attrs: {
						fill: "#4d9c58",
					},
				};
			} else {
				updatedOptions.areas[key] = {
					attrs: {
						fill: "#8B0000",
					},
				};
			}
		} else if (countriesOfDialect[sortable[1][0]].indexOf(key) > -1) {
			updatedOptions.areas[key] = {
				attrs: {
					fill: "#cd7f32",
				},
			};
		} else if (countriesOfDialect[sortable[2][0]].indexOf(key) > -1) {
			updatedOptions.areas[key] = {
				attrs: {
					fill: "#808080",
				},
			};
		} else if (countriesOfDialect[sortable[3][0]].indexOf(key) > -1) {
			updatedOptions.areas[key] = {
				attrs: {
					fill: "#bbb",
				},
			};
		} else {
			let isArab = arabCountries.includes(key);
			if (isArab) {
				updatedOptions.areas[key] = {
					attrs: {
						fill: "#bbb",
					},
				};
			}
		}
	});
	$mapcontainer.trigger("update", [
		{
			mapOptions: updatedOptions,
			animDuration: 1000,
		},
	]);
	// END OF MAP
};

// ==== Box Population ==== //
let __updateFarasaBlocks = (text) => {
	let segmenter = $.post("https://farasa-api.qcri.org/msa/webapi/segmenter", {
		text: text,
	})
		.done(function (data) {
			$("#seg").empty().append(data.segtext.join(" "));
			// Contains Segmenter Output
			// console.log(data.segtext.join(" "));
			sessionText.Segmented = data.segtext.join(" ");
		})
		.fail(function () {
			console.log("segmenter error");
		});
	let diacritizer = $.post(
		"https://farasa-api.qcri.org/msa/webapi/diacritizeV2",
		{ text: text }
	)
		.done(function (data) {
			$("#diac").empty().append(data.output);
			// Contains Diactrizer Output
			// console.log(data.output);
			sessionText.Diactrized = data.output;
		})
		.fail(function () {
			console.log("diacritizer error");
		});

	let pos = $.post("https://farasa-api.qcri.org/msa/webapi/pos", {
		text: text,
	})
		.done(function (data) {
			data.forEach((value, index, array) => {
				array[index] = value.POS;
			});
			$("#pos").empty().append(data.join(" "));
			sessionText.partsOfSpeach = data.join(" ");
		})
		.fail(function () {
			console.log("POS error");
		});

	// Machine Translation
	let mt = $.get("https://mt.qcri.org/api/v1/translate", {
		key: "247b2662312d8aca15b4be6f7ee888c9",
		langpair: "ar-en",
		domain: "dialectal",
		text: text,
	})
		.done(function (data) {
			$("#translation").empty().append(data.translatedText);
			sessionText.Translated = data.translatedText;
		})
		.fail(function () {
			console.log("Translation error");
		});

	let ner = $.post("/ner-receiver/", {
		text: text,
	})
		.done(function (data) {
			$("#ner").empty().append(data);
		})
		.fail(function () {
			console.log("NER error");
		});
};

// ==== On Screen Load ==== //
myModal.show();
screenCheck();
