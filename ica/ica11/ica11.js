// Complete variable definitions and random functions
const customName = document.getElementById("custom-name");
const generateBtn = document.querySelector(".generate");
const story = document.querySelector(".story");

function randomValueFromArray(array) {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
}


// text strings
const characters = ["Yo Mama", "Donald Trump", "Jesus Christ"];
const places = ["Yo Mama's House", "the DMV", "the bottom of the ocean"];
const events = [ "a hobo break dancing", "those soggy waffles they tell you not to eat", "one of those Mormon wives being arrested"];


// Partial return random string function
function returnRandomStoryString() {
  const char = randomValueFromArray(characters);
  const place = randomValueFromArray(places);
  const event = randomValueFromArray(events);

  let current_story = `It was 94 Fahrenheit outside, so ${char} decided to sell hot dogs at ${place}, but when they arrieved they saw ${event}. Bob saw the whole thing, and no longer had an apetite for the 300 pounds of hot dogs that ${char} was selling.`;

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