(function (window) {
	var WORKER_PATH = "/static/dictatejs/lib/recorderWorker.js";

	// The deprecated BlobBuilder's clone to accumilate the blobs (Stack Over Flow)
	var MyBlobBuilder = function () {
		this.parts = [];
	};

	MyBlobBuilder.prototype.append = function (part) {
		this.parts.push(part);
		this.blob = undefined; // Invalidate the blob
	};

	MyBlobBuilder.prototype.getBlob = function () {
		if (!this.blob) {
			this.blob = new Blob(this.parts, { type: "audio/x-raw" });
		}
		return this.blob;
	};

	var myBlobBuilder = new MyBlobBuilder(); // initiating the BlobBuilder's clone
	var Recorder = function (source, cfg) {
		var config = cfg || {};
		var bufferLen = config.bufferLen || 4096;
		this.context = source.context;
		this.node = this.context.createScriptProcessor(bufferLen, 1, 1);
		var worker = new Worker(config.workerPath || WORKER_PATH);
		worker.postMessage({
			command: "init",
			config: {
				sampleRate: this.context.sampleRate,
			},
		});
		var recording = false,
			currCallback;

		this.node.onaudioprocess = function (e) {
			if (!recording) return;
			worker.postMessage({
				command: "record",
				buffer: [e.inputBuffer.getChannelData(0)],
			});
		};

		this.configure = function (cfg) {
			for (var prop in cfg) {
				if (cfg.hasOwnProperty(prop)) {
					config[prop] = cfg[prop];
				}
			}
		};

		this.record = function () {
			recording = true;
		};

		this.stop = function () {
			recording = false;
		};

		this.clear = function () {
			worker.postMessage({ command: "clear" });
		};

		this.getBuffer = function (cb) {
			currCallback = cb || config.callback;
			worker.postMessage({ command: "getBuffer" });
		};

		this.exportWAV = function (cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || "audio/wav";
			if (!currCallback) throw new Error("Callback not set");
			worker.postMessage({
				command: "exportWAV",
				type: type,
			});
		};

		this.exportRAW = function (cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || "audio/raw";
			if (!currCallback) throw new Error("Callback not set");
			worker.postMessage({
				command: "exportRAW",
				type: type,
			});
		};

		this.export16kMono = function (cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || "audio/raw";
			if (!currCallback) throw new Error("Callback not set");
			worker.postMessage({
				command: "export16kMono",
				type: type,
			});
		};

		// FIXME: doesn't work yet
		this.exportSpeex = function (cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || "audio/speex";
			if (!currCallback) throw new Error("Callback not set");
			worker.postMessage({
				command: "exportSpeex",
				type: type,
			});
		};
		let i = 1; // initiating to count onmessage() ticks
		let j = 0; // initiating to name downloaded files
		worker.onmessage = (e) => {
			var blob = e.data;
			currCallback(blob);
			myBlobBuilder.append(blob);
			// Each "Tick" or call on this function is 200 +- 50ms (The Bigger The Blob the More Accurate The Predection -There is a limit-)
			// After -30- Ticks, the Blob Gets Saved To Be Downloaded and Sent to the ADI's API
			i++ % 30 === 0 ? saveBlobPack(myBlobBuilder.getBlob()) : null;
		};
		let saveBlobPack = (bP) => {
			let fd = new FormData();
			fd.append("file", bP, `voice${j++}.raw`);
			// console.log(fd.get("audio"));
			let audioAction = $.ajax({
				type: "POST",
				enctype: "multipart/form-data",
				url: "/audio-receiver/",
				data: fd,
				processData: false,
				contentType: false,
				success: (data) => {
					updateMapAndList(JSON.parse(data));
				},
			});
			// Resetting the blobs accumilated in the BlobBuilder
			myBlobBuilder.parts = [];
		};

		source.connect(this.node);
		this.node.connect(this.context.destination); //TODO: this should not be necessary (try to remove it)
	};

	Recorder.forceDownload = function (blob, filename) {
		var url = (window.URL || window.webkitURL).createObjectURL(blob);
		var link = window.document.createElement("a");
		link.href = url;
		link.download = filename || "output.wav";
		var click = document.createEvent("Event");
		click.initEvent("click", true, true);
		link.dispatchEvent(click);
	};

	window.Recorder = Recorder;
})(window);
