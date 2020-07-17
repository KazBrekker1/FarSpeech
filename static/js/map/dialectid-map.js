let Dialects = {
	dz: "Algeria",
	eg: "Egypt",
	iq: "Iraq",
	jo: "Jordan",
	sa: "Saudi Arabia",
	kw: "Kuwait",
	lb: "Lebanon",
	ly: "Libya",
	mr: "Mauritania",
	ma: "Morocco",
	om: "Oman",
	ps: "Palestine",
	qa: "Qatar",
	sd: "Sudan",
	sy: "Syria",
	ae: "United Arab Emirates",
	ye: "Yemen",
};

$mapcontainer = $(".mapcontainer");
$mapcontainer.mapael({
	map: {
		name: "arabworld2",
		defaultArea: {
			attrs: {
				fill: "#f0f0f0",
				stroke: "#e0e0e0",
			},
			tooltip: {
				content: function () {
					return `<h6 class='text-info'>${Dialects[state]}</h6>`;
				},
			},
			eventHandlers: {
				mouseover: function (e, id) {
					state = id;
				},
			},
		},
	},
	// Customize some areas of the map
	areas: {
		eg: {
			attrs: { fill: "#bbb" },
		},
		ly: {
			attrs: { fill: "#bbb" },
		},
		dz: {
			attrs: { fill: "#bbb" },
		},
		ma: {
			attrs: { fill: "#bbb" },
		},
		sd: {
			attrs: { fill: "#bbb" },
		},
		ps: {
			attrs: { fill: "#bbb" },
		},
		lb: {
			attrs: { fill: "#bbb" },
		},
		tn: {
			attrs: { fill: "#bbb" },
		},
		eh: {
			attrs: { fill: "#bbb" },
		},
		jo: {
			attrs: { fill: "#bbb" },
		},
		sy: {
			attrs: { fill: "#bbb" },
		},
		iq: {
			attrs: { fill: "#bbb" },
		},
		sa: {
			attrs: { fill: "#bbb" },
		},
		qa: {
			attrs: { fill: "#bbb" },
		},
		bh: {
			attrs: { fill: "#bbb" },
		},
		kw: {
			attrs: { fill: "#bbb" },
		},
		ae: {
			attrs: { fill: "#bbb" },
		},
		om: {
			attrs: { fill: "#bbb" },
		},
		ye: {
			attrs: { fill: "#bbb" },
		},
		so: {
			attrs: { fill: "#bbb" },
		},
		xs: {
			attrs: { fill: "#bbb" },
		},
		dj: {
			attrs: { fill: "#bbb" },
		},
		mr: {
			attrs: { fill: "#bbb" },
		},
		hm: {
			attrs: { fill: "#bbb" },
		},
	},
});
