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
model.runAll();
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
    //...
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

Of course, usually you only want an event to happen if certain preconditions are met. This precondition check happens in the `"when"` function. Each event has a `"when"` function, which takes a state as an input and should return either `true` or `false`. At the beginning of every step, Subdwarf runs each event's `"when"` function, with the current state as the input. If `"when"` returns `true`, the event is a possible subsequent event; otherwise, it is not. One of the possible events is chosen at random to occur.

 For example, suppose you're generating bank robbery stories. First, the robbers need to pull out guns and let everyone know that this is a robbery; this can only happen before the robbery begins. Once that happens, two possible events that can follow are are the teller handing over the money, and the crowd inside the bank starting to panic. Both of these events can only happen once the robbery starts.

In event syntax, this looks like:

```javascript
bankHeist = {
  "starting state": {"robbery": "planned"},
  "events": [
    {
        "name": "guns come out",
        "when": function(state) {return state["robbery"] === "planned"},
        "effects": function(state) {
          this.addToNarrative("'This is a robbery!' they shout, pulling out guns");
          state["robbery"] = "in progress";
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
      "name": "crowd freaks out",
      "when": function(state) {return state["robbery"] === "in progress"},
      "effects": function(state) {
          let text = ["The crowd freaks out", "The crowd starts to panic"];
          this.addToNarrative(subdwarf.choice(text));
          state["crowd"] = "panic";
        }
      }
  ]
}
```
At the beginning of a model run, the value of the `"robbery"` tag is `"planned"`. At this point, only one event is valid: `"guns come out"`. When that event is activated, the value of the `"robbery"` tag changes from `"planned"` to `"in progress"`. In the next step, that opens up two possible next events: `"teller hands over the money"` and `"crowd freaks out"`. Notice that `"crowd freaks out"` doesn't change the value of `"robbery"` -- meaning that if the crowd freaks out, the teller can still hand over the money in the following step. However, `"teller hands over the money"` *does* change the value of `"robbery"` -- once that happens, the `"crowd freaks out"` event can no longer occur.

#### Debug mode

You can run a model in debug mode to see the full state at each step, as well as each possible next event and their probability. To do that, you can run a model in debug mode. Continuing the above example:

```javascript
let model = new subdwarf.EventModel(bankHeist);
model.debugMode = true;
model.runAll();
```

Example output will be:

```
Step 0
{ robbery: 'planned' }
Possible next events:
{ 'guns come out': 1 }
Chosen event: guns come out

'This is a robbery!' they shout, pulling out guns


Step 1
{ robbery: 'in progress' }
Possible next events:
{ 'teller hands over the money': 0.5, 'crowd freaks out': 0.5 }
Chosen event: teller hands over the money

The teller hands over the money.


Step 2
{ robbery: 'escape' }
Possible next events:
{}
The teller hands over the money.

```

### Weights

In many cases, we want different events to have different probabilities of happening; two events may both be possible, but one might be more likely than the other. Different world states may may some events more or less likely. For example, a `"rain"` event may happen at any time of year, but is more likely for `{"season": "rainy season"}` than `{"season": "dry season"}`. 

The relative likelihood of an event happening when it is possible is controlled by its **weight**. By default, all events have weight 0, making them equally likely. For example, if there are four possible events, each one has a 25% chance of occuring. Weights higher than 0 make an event more likely; weights lower than 0 make an event less likely. 

Event weights are given in their `"weight"` propery. An event's weight can either be a number, or a function that takes a state as an argument and returns a number.  For example:

```javascript
{"events": [
  {
  "name": "Asteroid impact",
  "when": function(state) { return true;},
  "weight": -5 // Extremely unlikely
  "effects": function(state) {
    this.addToNarrative("An asteroid hits the planet surface, leaving a crater.")
    state["craters"] = "Asteroid crater";
  },
  {
  "name": "Rain",
  "when": function(state) { return true;},
  "weight": function(state) {
    let w = -1; // Somewhat unlikely
    if (state["season"] === "rainy season") w = 1; // More likely
    return w;
  }
  "effects": function(state) {
    this.addToNarrative("The rains pour down on the planet surface")
    state["weather"] = "rain";
  }
}
```

### Weight formula

To understand weights, we need to mention how Subdwarf does probabilities. Each event is assigned a `"weight"` property -- if no weight is explicitly given, it defaults to 0. If we write the weight of a certain event `i` as `Wi`, then:

`Prob(Next event === i) = exp(stability * Wi) / SUM( exp(stability * Wj))`

Where `Wj` are the weights of all other possible events. (`stability` is a parameter controlling how much small differences in weights matter; `stability=0` means that all events have the same probaibity regardless of weights; higher `stability` means that the highest-weighted event is increasingly certain to be chosen; by default, `stability=1`).

If all weights are the same, that means all events have the same probability of being chosen. Raising a weight by 1 roughly doubles the probability; reducing by one roughly halves it. 

Why are we exponentiating, instead of just summing the weights themselves? Two reasons: **(1)** This lets us use negative weights, so we can reduce weights below 0 without anything breaking, and **(2)** adds in the `stability` parameter, which allows us to make unlikely events increasingly possible.

To directly assign a weight to an event, explicitly give it a `"weight"` property. For example, an unlikely earthquake that could happen at any time might be:

```.json
{
	"name": "Earthquake",
	"preconditions": {},
	"weight": -2,
	"effects": {"really bad stuff": "true"}
}
```