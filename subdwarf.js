
  
function choice(t) {
  // convenience function for selecting among alternatives in a list
  return t[Math.floor(Math.random()*t.length)];
}

function weightedChoice(choices, exponentiate=true, beta=1) {
  if (exponentiate) {
    let expChoices = {};
    for (let key in choices) {
      expChoices[key] = Math.exp(choices[key]*beta);
    }
    choices = expChoices;
  }
  let total = 0;
  for (let key in choices) total += choices[key];
  let target = Math.random() * total;
  let counter = 0;
  for (let key in choices) {
    if (counter + choices[key] >= target) return key;
    counter += choices[key];
  }
  throw "Random choice failed!";

}

class EventModel {
  constructor(eventRules, startingState=null, stability=1) {
    this.events = eventRules["events"];

    // An explicitly-passed starting state overrules the starting state in the ruleset
    this.startingState = {};
    if (eventRules.hasOwnProperty("starting state"))
      this.startingState = eventRules["starting state"];
    if (startingState !== null) this.startingState = startingState;
    this.stability = stability;
    if (eventRules.hasOwnProperty("stability")) this.stability = eventRules["stability"];
    this.reset();
  }

  reset() {
    this.currentState = Object.assign({}, this.startingState);    
    this.eventLog = [];
    this.narrative = [];
    this.stateHistory = [];
    this.steps = 0;
    this.end = false;

  }

  filterEvents() {
    let nextEvents = [];
    for (let event of this.events) {
      if (event.when(this.currentState)) nextEvents.push(event);
    }
    return nextEvents;
  }

  step() {
    if (this.end) return;

    let possibleEvents = this.filterEvents();
    if (possibleEvents.length === 0) {
      this.end = true;
      return;
    }

    // Get event weights
    let eventWeights = {};
    for (let i in possibleEvents) {
      let event = possibleEvents[i];
      let weight = 0;
      if (event.hasOwnProperty("weight")) {
        if (typeof event["weight"] === "number") weight = event["weight"];
        if (typeof event["weight"] === "function") weight = event["weight"](this.currentState);
      }
      eventWeights[i] = weight;
    }
    
    let event = possibleEvents[weightedChoice(eventWeights)];
    let eventEffects = event.effects.bind(this);
    eventEffects(this.currentState);
    
    this.eventLog.push(event.name);
    this.stateHistory.push(Object.assign({}, this.currentState));
    this.steps++;
  }

  runAll(render=false, reset=true, maxSteps=50) {
    if (reset) this.reset();
    while (!this.end && this.steps < maxSteps) {
      this.step();
      if (render) {
        for (let i in this.narrative)
          if (this.narrative[i][0] === this.steps-1) console.log(this.narrative[i][1]);
      }
    }
  }

  addToNarrative(text) {
    let narrativeAddition = [this.steps, text];
    this.narrative.push(narrativeAddition);
  }

  renderNarrative() {
    let narrativeText = [];
    for (let i in this.narrative) {
      narrativeText.push(this.narrative[i][1]);
    }
    return narrativeText;
  }

}

module.exports = {
  EventModel: EventModel, 
  choice: choice, 
  weightedChoice: weightedChoice
};
