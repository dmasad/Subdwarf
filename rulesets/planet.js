let subdwarf = require("../subdwarf");

// Helper lists and methods

factionTypes = ["church", "security force", "wealthy", "scientists", "mob"];


planetModel = {
  "starting state": {
    "type": "unsettled",
    "activities": new Set(),
    "known resources": new Set()
  },

  "events" :[
    {
      "name": "settlers arrive",
      "when": function(state) {return state["type"] === "unsettled";},
      "effects": function(state) {
        // TODO: Planet name
        this.addToNarrative("The first settlers land on the planet");
        state["type"] = "new colony";
        state["ruling faction"] = "pioneers";
        state["factions"] = ["pioneers"];
        state["government"] = "unified";
        state["population"] = "precarious";
        state["activities"] = new Set();
        state["settlements"] = "base camp";
        state["known resources"] = new Set();
      }
    },
    {
      "name": "food production stabilizes",
      "when": function(state) {return state["population"] === "precarious";},
      "effects": function(state) {
        this.addToNarrative("Greenhouses and simple agriculture allow the population to sustain itself");
        state["population"] = "stable";
      }
    },
    {
      "name": "food starts to run out",
      "when": function(state) {return state["population"] === "precarious";},
      "weight": -1,
      "effects": function(state) {
        this.addToNarrative("Settlement food stores start to run low");
        state["population"] = "shrinking";
      }
    },
    {
      "name": "food starts to run out",
      "when": function(state) {return state["population"] === "precarious";},
      "weight": -1,
      "effects": function(state) {
        this.addToNarrative("Settlement food stores start to run low");
        state["population"] = "shrinking";
      }
    },
    {
      "name": "town established",
      "when": function(state) {return state["settlements"] === "base camp";},
      "weight": -1,
      "effects": function(state) {
        this.addToNarrative("The simple base camp expands into a small town");
        state["settlements"] = "town";
      }
    },
    {
      "name": "early exploration",
      "when": function(state) {return state["type"] === "new colony"},
      "weight": -1,
      "effects": function(state) {
        // TODO: Move the discovery list to a planet-specific object
        let possibleDiscoveries = {
          "nothing": 5,
          "ore deposits": 2,
          "fuel sources": 2,
          "fertile land": 2,
          "alien plant-life": 1,
          "alien artifacts": 0.1
        }
        let discovery = subdwarf.weightedChoice(possibleDiscoveries, false);
        let txt = "An expedition sets out to explore the planet and discovers";
        txt += discovery + ".";
        this.addToNarrative(txt);
        if (discovery !== "nothing") 
            state["known resources"].add(discovery);
      }
    },
    {
      "name": "mining begins",
      "when": function(state) {
        return (state["known resources"].has("ore deposits") &&
                !state["activities"].has("mining"))
      },
      "effects": function(state) {
        this.addToNarrative("Ore mining begins");
        state["activities"].add("mining");
      }
    },
    {
      "name": "extraction begins",
      "when": function(state) {
        return (state["known resources"].has("fuel sources") &&
                !state["activities"].has("extraction"))
      },
      "effects": function(state) {
        this.addToNarrative("Extraction of local fuel sources begins");
        state["activities"].add("extraction");
      }
    },
    {
      "name": "agriculture begins",
      "when": function(state) {
        return (state["known resources"].has("fertile land") &&
                !state["activities"].has("agriculture"))
      },
      "effects": function(state) {
        this.addToNarrative("Farms are built to take advantage of the fertile land");
        state["activities"].add("agriculture");
      }
    },
    {
      "name": "food production improves",
      "when": function(state) {
        return (["precarious", "stable", "shrinking"].includes(state["population"])
                && state["activities"].has("agriculture"));
      },
      "weight": -1,
      "effects": function(state) {
        if (["precarious", "shrinking"].includes(state["population"])) {
          this.addToNarrative("Agriculture allows the population to stabilize");
          state["population"] = "stable";
        }
        else {
          this.addToNarrative("Local agriculture allows the population to grow");
          state["population"] = "growing";
        }
      }
    },
    {
      "name": "research begins",
      "when": function(state) {
        return (state["known resources"].has("alien plant-life") &&
                !state["activities"].has("research"))
      },
      "effects": function(state) {
        this.addToNarrative("Research begins on the local plants");
        state["activities"].add("research");
      }
    },
    {
      "name": "colony flourishes",
      "when": function(state) {
        if (state["type"] === "new colony" && state["settlements"] === "town"
            && state["population"] === "growing"
            && state["activities"].size > 1) return true;
        return false;
      },
      "weight": -2,
      "effects": function(state) {
        this.addToNarrative("The colony is flourishing!");
        state["type"] = "flourishing colony";
        this.end = true; // TODO: This isn't true.
      },
    },
    {
      "name": "colony failing",
      "when": function(state) {
        return (state["type"] === "new colony" && 
                state["population"] === "shrinking")
      },
      "weight": -2,
      "effects": function(state) {
        this.addToNarrative("The colony is beginning to fail");
        state["type"] = "failing colony";
        this.end = true; // TODO: This isn't true.
      },
    },
    {
      "name": "new faction emerges",
      "when": function(state) { return state["government"] === "unified"; },
      "weight": -2,
      "effects": function(state) {
        let newFaction = subdwarf.choice(factionTypes);
        if (state["factions"].includes(newFaction)) {
          this.addToNarrative("The " + newFaction + " are agitated");
          return;
        }
        state["factions"].push(newFaction);
        this.addToNarrative("The " + newFaction + " begin to emerge as a force to be reckoned with");
      }
    },
    {
      "name": "power struggle",
      "when": function(state) { 
        return (state["government"] === "unified" && 
                state["factions"].length > 1);
      },
      "weight": -2,
      "effects": function(state) {
        let faction = subdwarf.choice(factionTypes);
        if (state["ruling faction"] === faction ) {
          // Government crackdown
            this.addToNarrative("The " + faction + " tighten their grip on power"); 
            return;
        }
        if (Math.random() < 0.2) {
          // The coup succeeds
          this.addToNarrative("The " + faction + " manage to sieze power, and take over the colony");
          state["ruling faction"] = faction;
        }
        else {
          // The coup fails
          this.addToNarrative("The " + faction + " attempt a coup, but are defeated by the ruling " + state["ruling faction"]);
          if (Math.random() < 0.5) {
            // The losers are eliminated
            let factionIndex = state["factions"].indexOf(faction);
            state["factions"].splice(factionIndex, 1);
            this.addToNarrative("The " + faction + " are completely suppressed");
          }
        }
      }
    }
  ]
}

let model = new subdwarf.EventModel(planetModel);
//model.runAll(true, true, 10, true);
model.runAll(true, true, 20, false);
