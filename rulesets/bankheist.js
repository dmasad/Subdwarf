let subdwarf = require("../subdwarf");

bankHeist = {
  "events": [
    {
      "name": "crew pulls up",
      "when": function(state) {return Object.keys(state).length === 0;},
      "effects": function(state) {
        this.addToNarrative("The crew pulls up outside the bank.");
        state["crew"] = "outside";
        state["getaway car"] = "outside";
      }
    },
    {
      "name": "crew walks inside",
      "when": function(state) {return state["crew"] === "outside"},
      "effects": function(state) {
        this.addToNarrative("The crew walks into the bank.");
        state["crew"] = "inside";
      }
    },
    {
      "name": "guns come out",
      "when": function(state) {return state["crew"] === "inside"},
      "effects": function(state) {
        this.addToNarrative(" 'This is a robbery!' they shout, pulling out guns");
        state["robbery"] = "in progress";
      }
    },
    {
      "name": "crowd freaks out",
      "when": function(state) {return state["crew"] === "inside"},
      "weight": function(state) { 
        if (state["robbery"] === "in progres") return 1;
        else return -2;
      },
      "effects": function(state) {
          let text = ["The crowd freaks out", "The crowd starts to panic"]
          this.addToNarrative(subdwarf.choice(text));
          state["crowd"] = "panic";
      }
    },
    {
      "name": "customer tries to be a hero",
      "when": function(state) {return state["robbery"] === "in progress"},
      "weight": function(state) {
          let w = -2;
          if (state["crowd"] === "panic") w += 3;
          if (state["fight"] === "customer") w += 1;
          if (state["fight"] === "guard") w -= 2;
          return w; 
      },
      "effects": function(state) {
        this.addToNarrative("A customer tries to fight back!");
        state["fight"] = "unarmed";
      }
    },
    {
      "name": "guard tries to be a hero",
      "when": function(state) {return state["robbery"] === "in progress" },
      "weight": function(state) {
          let w = -2;
          if (state["crowd"] === "panic") w += 3;
          if (state["fight"] === "customer") w += 1;
          return w;
      },
      "effects": function(state) {
        this.addToNarrative("A guard pulls out his gun and decides to be a hero.");
        state["fight"] = "guard";
      }
    },
    {
      "name": "robber shoots someone",
      "when": function(state) {return state["robbery"] === "in progress"},
      "weight": function(state) {
          let w = -2;
          if (state["crowd"] === "panic") w += 1;
          if (state["fight"]) w += 1;
          if (state["fight"] === "customer") w += 1;
          if (state["fight"] === "guard") w += 1;
          return w;
      },
      "effects": function(state) {
          let text = ["A robber shoots one of the customers",
                      "A robber shoots one of the guards!"]
          this.addToNarrative(subdwarf.choice(text));
          state["fight"] = "over";
          state["crowd"] = "cowed"
          state["police"] = "called";

          if (Math.random() < 0.3) {
              this.addToNarrative("We need to get out of here!");
              state["robbery"] = "escape";
          }
      }
    },
    {
      "name": "teller hands over the money",
      "when": function(state) {return state["robbery"] === "in progress"},
      "effects": function(state) {
        this.addToNarrative("The teller hands over the money.");
        state["robbery"] = "escape";
      }
    },
    {
      "name": "teller activates the alarm",
      "when": function(state) {return state["robbery"] === "in progress"},
      "weight": -2,
      "effects": function(state) {
        this.addToNarrative("The teller manages to activate the silent alarm");
        state["police"] = "called";
      }
    },
    {
      "name": "police arrive",
      "when": function(state) {return state["robbery"]},
      "weight": function(state) {
          let w = -1;
          if (state["police"] === "called") w += 2;
          return w;
      },
      "effects": function(state) {
        this.addToNarrative("Police cars pull up outside the bank");
        state["police"] = "outside";
      }
    },
    {
        "name": "police get closer",
        "when": function(state) {return (state["police"] === "outside")},
        "weight": 1,
        "effects": function(state) {
          let text = "The police follow the robbers " + state["crew"]
          this.addToNarrative(text);
          state["police"] = "";
        }
    },
    {
      "name": "crew leave",
      "when": function(state) {return state["robbery"]==="escape"},
      "weight": 0,
      "effects": function(state) {
        this.addToNarrative("The crew start to escape from the bank.");
        state["crew"] = "outside";
      }
    },
    {
      "name": "fight with police",
      "when": function(state) {
        return (state.hasOwnProperty("crew") && state["crew"] === state["police"])},
      "weight": 5,
      "effects": function(state) {
        this.addToNarrative("The robbers and the police fight " + state["crew"] + " the bank")
        if (Math.random() < 0.5) {
            this.addToNarrative("The police manage to arrest the robbers");
            this.end = true;
        }
      }
    },
    {
      "name": "crew gets into car",
      "when": function(state) {
        return (state["crew"] === "outside" && state["getaway car"]==="outside")
      },
      "weight": 0,
      "effects": function(state) {
        this.addToNarrative("The crew gets into the getaway car");
        state["crew"] = "driving";
      }
    },
    {
      "name": "crew escapes",
      "when": function(state) {return state["crew"] === "driving"},
      "weight": 0,
      "effects": function(state) {
        this.addToNarrative("The crew manages to escape!");
        this.end = true;
      }
    },
    {
      "name": "getaway car pulls away",
      "when": function(state) {
        return (state["crew"] === "inside" & state["getaway car"] === "outside")},
      "weight": 0,
      "effects": function(state) {
        this.addToNarrative("The getaway car pulls away");
        state["getaway car"] = "gone";
      }
    },
  ]
}

let model = new subdwarf.EventModel(bankHeist);
model.runAll(render=true);
//while(!model.end) model.step();
//let narrative = model.renderNarrative();
///for (let i in narrative) console.log(narrative[i]);