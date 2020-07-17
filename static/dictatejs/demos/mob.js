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
		$(".micButton").removeClass("btn-outline-danger");
		$(".micButton").addClass("btn-danger");
		$("#buttonToggleListening").html("Stop");
		stopwatch.start();
		$("#buttonToggleListening").prop("disabled", false);
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
	},
	onServerStatus: function (json) {
		__serverStatus(json.num_workers_available);
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
		sessionText.Raw = val;
		__updateFarasaBlocks($("#trans").val());
		startPosition = startPosition + hypText.length;
		endPosition = startPosition;
		$("#trans").prop("selectionStart", endPosition);
		doUpper = /\. *$/.test(hypText) || /\n *$/.test(hypText);
		doPrependSpace = hypText.length > 0 && !/\n *$/.test(hypText);

		// Scrolls Down the Divs as the amount of text increases
		$(".scrollable").each((index, element) => {
			$(element).scrollTop($(element).height());
		});

		// This Calls a method in the backend to stream blobs into the ADI api
		// Can Cause Error Initially Due to the absence of RAW Files to Send (Ignore the Error Caused in the dialect handling loop below)
		$.get("/audio-receiver/").done((res) => {
			let goal = JSON.parse(res);
			updateMapAndList(goal);
		});
	},
	onError: function (code, data) {
		dictate.cancel();
		__error(code, data);
	},
	onEvent: function (code, data) {
		// Commented for Debugging Clarity in the console
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

function __serverStatus(msg) {
	$("#serverWorkers").text(msg);
}

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
	let blocks = ["#ner", "#diac", "#seg", "#pos", "#translation"];
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

	let items = [".perc-1", ".perc-2", ".perc-3", ".perc-4"];
	// Resets the scrolled height to the begining
	items.forEach((item) => {
		$(item)
			.empty()
			.append(
				'<h4>Country</h4><span class="badge bg-primary rounded-pill p-1">%</span>'
			);
	});

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

function init() {
	clearCache();
	dictate.init();
	clearTranscription();
}

$(document).ready(function () {
	dictate.init();
	$("#servers").change(function () {
		dictate.cancel();
		let servers = $("#servers").val().split("|");
		dictate.setServer(servers[0]);
		dictate.setServerStatus(servers[1]);
	});
});
