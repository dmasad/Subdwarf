let subdwarf = require("../subdwarf");

testEvents = {
    "events": [
      {
        "name": "first event",
        "when": function(state) {return Object.keys(state).length === 0;},
        "effects": function(state) {
          state["started"] = true;
          this.addToNarrative("started");
          }
      },
      {
        "name": "second event",
        "when": function(state) {return state["started"]},
        "effects": function(state) {
          state["current"] = "A";
          this.addToNarrative("second event");
        }
      },
      {
        "name": "third event",
        "when": function(state) {return state["started"]},
        "weight": 1,
        "effects": function(state) {
          state["current"] = "B";
          this.addToNarrative("another second event");
        }
      },
        {
            "name": "fourth event",
            "when": function(state) {return state["current"] === "B"},
            "weight": function(state) {return 5},
            "effects": function(state) {
              this.addToNarrative("fourth event");
            }

        }
      
    ]
  };

let model = new subdwarf.EventModel(testEvents);
for (let i=0; i<5; i++) model.step();
console.log(model.narrative);