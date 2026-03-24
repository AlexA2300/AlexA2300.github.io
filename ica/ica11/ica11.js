// Complete variable definitions and random functions
const customName = document.getElementById("custom-name");
const generateBtn = document.querySelector(".generate");
const story = document.querySelector(".story");

function randomValueFromArray(array) {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
}


// text strings
const characters = ["Willy the Goblin", "Big Daddy", "Father Christmas"];
const places = ["the soup kitchen", "Disneyland", "the White House"];
const events = [ "spontaneously combusted", "melted into a puddle on the sidewalk", "turned into a slug and slithered away"];


// Partial return random string function
function returnRandomStoryString() {
  // It was 94 Fahrenheit outside, so :insertx: went for a walk. When they got to :inserty:, they stared in horror for a few moments, then :insertz:. Bob saw the whole thing, but was not surprised — :insertx: weighs 300 pounds, and it was a hot day.
  const char = randomValueFromArray(characters);
  const place = randomValueFromArray(places);
  const event = randomValueFromArray(events);

  let current_story = `It was 94 Fahrenheit outside, so ${char} went for a walk. When they got to ${place}, they stared in horror for a few moments, then ${event}. Bob saw the whole thing, but was not surprised — ${char} weighs 300 pounds, and it was a hot day.`;

  return current_story;
}


// Event listener and partial generate function definition
generateBtn.addEventListener("click", generateStory);

function generateStory() {
  let current_story = returnRandomStoryString();
  if (customName.value !== "") {
    const name = customName.value;
    current_story = current_story.replace("Bob", name);
  }

  if (document.getElementById("uk").checked) {
    const weight = `${Math.round(300 / 14)} stone`;
    const temp = `${Math.round((94 - 32) * (5 / 9))} Celsius`;
    current_story = current_story.replace("300 pounds", weight);
    current_story = current_story.replace("94 Fahrenheit", temp);
  }

  // TODO: replace "" with the correct expression
  story.textContent = current_story;
  story.style.visibility = "visible";
}