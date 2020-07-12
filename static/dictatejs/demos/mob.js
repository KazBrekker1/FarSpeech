// Global UI elements:
//  - log: event log
//  - trans: transcription window

// Global objects:
//  - isConnected: true iff we are connected to a worker
//  - tt: simple structure for managing the list of hypotheses
//  - dictate: dictate object with control methods 'init', 'startListening', ...
//       and event callbacks onResults, onError, ...
let isConnected = false;

let tt = new Transcription();
let sessionText = {
	Raw: "",
	Segmented: "",
	Diactrized: "",
	partsOfSpeach: "",
};
let startPosition = 0;
let endPosition = 0;
let doUpper = false;
let doPrependSpace = true;

let MIN_VOL = -100;
let MAX_VOL = -50;
let dialectHistory = [];

let updatedOptions = { areas: {} };

let arabCountries = [
	"xs",
	"dj",
	"so",
	"eg",
	"sa",
	"qa",
	"om",
	"kw",
	"ae",
	"eh",
	"ma",
	"dz",
	"tn",
	"ly",
	"sy",
	"jo",
	"ps",
	"lb",
	"sd",
	"ye",
	"iq",
	"mr",
	"so",
	"xs",
	"dj",
];

let countriesOfDialect = {
	ALG: ["dz"],
	EGY: ["eg"],
	IRA: ["iq"],
	JOR: ["jo"],
	KSA: ["sa"],
	KUW: ["kw"],
	LEB: ["lb"],
	LIB: ["ly"],
	MAU: ["mr"],
	MOR: ["ma"],
	OMA: ["om"],
	PAL: ["ps"],
	QAT: ["qa"],
	SUD: ["sd"],
	SYR: ["sy"],
	UAE: ["ae"],
	YEM: ["ye"],
};
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

function capitaliseFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function prettyfyHyp(text, doCapFirst, doPrependSpace) {
	if (doCapFirst) {
		text = capitaliseFirstLetter(text);
	}
	tokens = text.split(" ");
	text = "";
	if (doPrependSpace) {
		text = " ";
	}
	let doCapitalizeNext = false;
	tokens.map(function (token) {
		if (text.trim().length > 0) {
			text = text + " ";
		}
		if (doCapitalizeNext) {
			text = text + capitaliseFirstLetter(token);
		} else {
			text = text + token;
		}
		doCapitalizeNext = token === "." || /\n$/.test(token);
	});

	text = text.replace(/ ([,.!?:;])/g, "$1");
	text = text.replace(/ ?\n ?/g, "\n");
	return text;
}
let dictate = new Dictate({
	server: $("#servers").val().split("|")[0],
	serverStatus: $("#servers").val().split("|")[1],
	referenceHandler:
		"http://45.55.56.40:8888/dev/duplex-speech-api/dynamic/reference",
	recorderWorkerPath: "/static/dictatejs/lib/recorderWorker.js",
	onReadyForSpeech: function () {
		isConnected = true;
		__message("READY FOR SPEECH");
		$(".buttonsContainer").addClass("live");
		$(".micButton").removeClass("btn-outline-danger");
		$(".micButton").addClass("btn-danger");
		$("#buttonToggleListening").html("Stop");
		stopwatch.start();
		$("#buttonToggleListening").prop("disabled", false);
		$("#buttonCancel").prop("disabled", false);
		$("#resetButton").prop("disabled", true);
		endPosition = startPosition;
		let textBeforeCaret = $("#trans").val().slice(0, startPosition);
		doUpper =
			textBeforeCaret.length === 0 ||
			/\. *$/.test(textBeforeCaret) ||
			/\n *$/.test(textBeforeCaret);
		doPrependSpace =
			textBeforeCaret.length > 0 && !/\n *$/.test(textBeforeCaret);
	},
	onEndOfSpeech: function () {
		__message("END OF SPEECH");
		$("#buttonToggleListening").html("Stopping...");
		stopwatch.stop();
		$("#buttonToggleListening").prop("disabled", true);
	},
	onEndOfSession: function () {
		isConnected = false;
		__message("END OF SESSION");
		$("#buttonToggleListening").html("Speak");
		$(".micButton").removeClass("btn-danger");
		$(".micButton").addClass("btn-outline-danger");
		stopwatch.stop();
		$("#buttonToggleListening").prop("disabled", false);
		$("#buttonCancel").prop("disabled", true);
		$("#resetButton").prop("disabled", false);
	},
	onServerStatus: function (json) {
		if (json.num_workers_available == 0 && !isConnected) {
			$("#buttonToggleListening").prop("disabled", true);
		} else {
			$("#buttonToggleListening").prop("disabled", false);
		}
	},
	onPartialResults: function (hypos) {
		hypText = prettyfyHyp(hypos[0].transcript, doUpper, doPrependSpace);
		val = $("#trans").val();
		$("#trans").val(
			val.slice(0, startPosition) + hypText + val.slice(endPosition)
		);
		__updateFarasaBlocks($("#trans").val());
		endPosition = startPosition + hypText.length;
		$("#trans").prop("selectionStart", endPosition);
	},
	onResults: function (hypos) {
		hypText = prettyfyHyp(hypos[0].transcript, doUpper, doPrependSpace);
		val = $("#trans").val();
		$("#trans").val(
			val.slice(0, startPosition) + hypText + val.slice(endPosition)
		);

		// console.log(val);
		sessionText.Raw = val;

		__updateFarasaBlocks($("#trans").val());
		startPosition = startPosition + hypText.length;
		endPosition = startPosition;
		$("#trans").prop("selectionStart", endPosition);
		doUpper = /\. *$/.test(hypText) || /\n *$/.test(hypText);
		doPrependSpace = hypText.length > 0 && !/\n *$/.test(hypText);
		// Scrolls Down the Divs as the amount of text incerases
		$(".name-entity").scrollTop($(".name-entity").height());
		$(".segmenter").scrollTop($(".segmenter").height());
		$(".diacritization").scrollTop($(".diacritization").height());
		$(".parts-of-speach").scrollTop($(".parts-of-speach").height());

		// This Calls a method in the backend to stream blobs into the ADI api
		// Can Cause Error Initially Due to the absence of RAW Files to Send (Ignore the Error Caused in the dialect handleing loop below)
		$.get("/audio-reciver/").done((res) => {
			let goal = JSON.parse(res);
			// console.log(goal);
			updateMapAndList(goal);
		});
	},
	onError: function (code, data) {
		dictate.cancel();
		__error(code, data);
	},
	onEvent: function (code, data) {
		// Commented for Debugging Clarity in the consol
		// __message(code, data);
	},
});

// Private methods (called from the callbacks)
function __message(code, data) {
	console.log("msg: " + code + ": " + (data || ""));
}

function __error(code, data) {
	console.log("ERR: " + code + ": " + (data || ""));
}

function __updateTranscript(text) {
	$("#trans").val(text);
}

function __updateFarasaBlocks(text) {
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
		})
		.always(function () {
			console.log("finished");
		});
	let pos = $.post("https://farasa-api.qcri.org/msa/webapi/pos", {
		text: text,
	})
		.done(function (data) {
			data.forEach((value, index, array) => {
				array[index] = value.POS;
			});
			$("#pos").empty().append(data.join(" "));
			// Containes Parts Of Speach Data
			sessionText.partsOfSpeach = data.join(" ");
		})
		.fail(function () {
			console.log("POS error");
		});
	// Commented Till Farasa's Server Problem Is Fixed
	// let ner = $.post("https://farasa-api.qcri.org/msa/webapi/ner", {
	// 	text: text,
	// })
	// 	.done(function (data) {
	// 		let out = "";
	// 		data.forEach((text) => {
	// 			let flag = text.split("/")[1].slice(-3);
	// 			let content = [text.split("/")[0]];
	// 			switch (flag) {
	// 				case "LOC":
	// 					out += `<span class="text-danger"><strong> ${content} </strong></span>`;
	// 					break;
	// 				case "ORG":
	// 					out += `<span class="text-primary"><strong> ${content} </strong></span>`;
	// 					break;
	// 				case "ERS":
	// 					out += `<span class="text-success"><strong> ${content} </strong></span>`;
	// 					break;
	// 				case "O":
	// 					out += `<span><strong> ${content} </strong></span>`;
	// 					break;
	// 				default:
	// 					out += `<span><strong> ${content} </strong></span>`;
	// 					break;
	// 			}
	// 		});
	// 		$("#ner").empty().append(out);
	// 	})
	// 	.fail(function () {
	// 		console.log("NER error");
	// 	});
}

// Public methods (called from the GUI)
function toggleListening() {
	if (isConnected) {
		dictate.stopListening();
	} else {
		init(); // to resolve chrome microphone connection problem
		dictate.startListening();
	}
}

function cancel() {
	dictate.cancel();
}

function clearTranscription() {
	$("#trans").val("");
	// needed, otherwise selectionStart will retain its old value
	$("#trans").prop("selectionStart", 0);
	$("#trans").prop("selectionEnd", 0);
}

function clearFarasaBlocks() {
	let blocks = ["#ner", "#diac", "#seg", "#pos"];
	// Resets the scrolled height to the begining
	blocks.forEach((b) => {
		$(b).empty();
		$(b).prop("selectionStart", 0);
		$(b).prop("selectionEnd", 0);
	});
}

function clearCache() {
	let dialectHistory = [];
	clearTranscription();
	clearFarasaBlocks();

	// Turns the buffer-text div on
	bufferTextSwitch(true);

	$(".perc-1")
		.empty()
		.append(
			'<h4>Country</h4><span class="badge bg-primary rounded-pill p-1">%</span>'
		);
	$(".perc-2")
		.empty()
		.append(
			'<h4>Country</h4><span class="badge bg-primary rounded-pill p-1">%</span>'
		);
	$(".perc-3")
		.empty()
		.append(
			'<h4>Country</h4><span class="badge bg-primary rounded-pill p-1">%</span>'
		);
	$(".perc-4")
		.empty()
		.append(
			'<h4>Country</h4><span class="badge bg-primary rounded-pill p-1">%</span>'
		);
	Object.keys($mapcontainer.data("mapael").areas).forEach(function (
		key,
		index
	) {
		let isArab = arabCountries.includes(key);
		if (isArab) {
			updatedOptions.areas[key] = {
				attrs: {
					fill: "#2d6a52",
				},
			};
		}
	});

	$mapcontainer.trigger("update", [
		{
			mapOptions: updatedOptions,
			animDuration: 1000,
		},
	]);
	stopwatch.reset();
	$(".stopwatch").text("00:00:00");
}

let saveSessionHandler = () => {
	saveSession(sessionText);
};

// Saves the Text Spoken to a .txt file as a json object
let saveSession = (text) => {
	let value = JSON.stringify(text, null, 2);
	let blob = new Blob([value], { type: "text/plain;charset=utf-8" });
	saveAs(blob, "Text.txt");
};

// Updates The Map And The List
let updateMapAndList = (goal) => {
	let sortable = [];
	for (let dialect in goal[0]["final_score"]) {
		sortable.push([dialect, goal[0]["final_score"][dialect]]);
	}

	sortable.sort(function (a, b) {
		return b[1] - a[1];
	});

	// Turns the buffer-text div off
	bufferTextSwitch(false);

	// List Updating
	topX = sortable.slice(0, 4);
	console.log(topX);
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

function init() {
	clearCache();
	dictate.init();
	clearTranscription();
}

// Changes the dropdown list's arrow according to the screen size
let screenCheck = () => {
	if ($(window).width() < 768) {
		// console.log("This Is Phone");
		$(".tools").removeClass("dropdown");
		$(".tools").addClass("dropup");
	}
};

// Toggeling Between Map and List
let hidden = false;
let handleContainerView = async () => {
	$(".map").attr("hidden", hidden);
	$(".diacList").attr("hidden", !hidden);
	hidden = !hidden;
};

// Handles the Buffer-Text's Visibility and the .mapcontainer's interactivity
let bufferTextSwitch = (bool) => {
	$(".mapcontainer").css({ "pointer-events": bool ? "none" : "all" });
	$(".buffer-text").css({
		opacity: bool ? 1 : 0,
		"z-index": bool ? 10 : -1,
	});
};

$(document).ready(function () {
	dictate.init();
	$("#servers").change(function () {
		dictate.cancel();
		let servers = $("#servers").val().split("|");
		dictate.setServer(servers[0]);
		dictate.setServerStatus(servers[1]);
	});
});
// To Hide the Map and Show the list initially
$(".map").attr("hidden", true);
screenCheck();
