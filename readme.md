# Subdwarf

Subdwarf is a generative system in JavaScript, intended to generate random, plausible sequences of events based on an event ruleset. Events modify the world state, which in turn determines which events might happen next. (Subdwarf is a very approximate reimplementation of my work-in-progress [MainSequence system](https://github.com/dmasad/MainSequence); a subdwarf is smaller than a main-sequence star).

Like MainSequence, Subdwarf is influenced by [Tracery](https://github.com/galaxykate/tracery), [Improv](https://github.com/sequitur/improv), and [cross-imact analysis](https://en.wikipedia.org/wiki/Cross_impact_analysis). The actual JavaScript implementation is *heavily* indebted to Allison Parrish's [seaduck](https://github.com/aparrish/seaduck).

#### Motivating example

Subdwarf is initially being developed as part of a minimal proof-of-concept implementation of a space trading game featuring procedurally-generated planets and histories.

## How to use

To generate a sequence of events using an example in the `rulesets` folder, run it in Node. e.g.

```
> node bankheist.js
The crew pulls up outside the bank.
The crew walks into the bank.
'This is a robbery!' they shout, pulling out guns
The teller hands over the money.
The crew start to escape from the bank.
The crew gets into the getaway car
The crew manages to escape!
```

To create your own event model:

```javascript
let subdwarf = require("./subdwarf.js");
let ruleSet = { 
    // Your ruleset here
};

let model = new subdwarf.EventModel(ruleSet);
model.runAll(render=true);
```

Event rulesets are defined as JavaScript objects, with the following structure: 

```javascript
let myRuleSet = {
	"events": [
		// A list of events:
		{
			"name": "An event name",
      "when": function(state) { /* check whether the event can happen from this state */ },
      "weight": 1, // A relative probability that this event will happen
      "effects": function(state) {
        // Changes to state tags
        state["some tag"] = "new value";
        state["new tag"] = ["first value"];
        this.addToNarrative("Some text to add to the narrative");
      }
		},
		...
	],
	"starting_state": 
		// Optional initial state object; defaults to {}
		{
			"some tag": "initial value",
			"another tag": ["a label"]
		}
}
``` 

For details on what that all means, keep reading.

## World State

A world state is defined by tags and labels. Tags are categories of facts or attributes about the world, while labels are specifc facts or attributes that are true at the moment. Tags and labels are generally assumed to be strings, but can be any valid JavaScript.

For example, an early state of a colony might be:

```javascript
{
	"settlements": ["First landing site"],
	"government": "Unified"
}
```

A later state might be:

```javascript
{
	"settlements": ["Capital city", "Many cities", "Factory farms"],
	"government": "City states",
	"international relations": "Simmering tensions",
	"economy": "Stagnant",
	"university": ["Biotech research", "Student radicals"]
}
```
## Events

Events are randomly chosen based on the current world state, and modify the world state. Each event has at a minimum three mandatory properties: `"name"`, `"when"`, and `"effects"`. The name is simply a unique identifier string. `"when"` is a function that takes as an input the current world state; it checks the tags and labels, and returns `true` if the event is reachable from this state, or `false` otherwise. Finally, `"effects"` is another function that takes the current state as an input; it modifies the state, and optionally adds text to the narrative using the `this.addToNarrative("text")` method. Note that the `"effects"` function doesn't need to return anything; it can modify the `state` object in place.

Here's the simplest possible event:

```javascript
{
	"name": "Asteroid impact",
	"when": function(state) { return true;},
	"effects": function(state) {
    this.addToNarrative("An asteroid hits the planet surface, leaving a crater.")
    state["craters"] = "Asteroid crater";
  }
}
```

This event has no preconditions (meaning it can occur at any time), and it updates the `"craters"` tag to have the value "Asteroid crater".

World state before:
```.json
{

}
```

Then `"Asteroid impact"` occurs.

```.json
{
	"craters": "Asteroid crater"
}
```
**IN PROGRESS**
