const newQuoteBtn = document.querySelector('#js-new-quote');
const answerBtn = document.querySelector('#js-tweet');
const apiEndpoint = 'https://trivia.cyberwisp.com/getrandomchristmasquestion';

let currentAnswer = '';

function displayQuote(question) {
  document.getElementById('js-quote-text').textContent = question;
  document.getElementById('js-answer-text').textContent = '';
}

function getQuote() {
  fetch(apiEndpoint)
    .then(response => response.json())
    .then(data => {
      displayQuote(data.question);
      currentAnswer = data.answer;
    })
    .catch(error => {
      console.error('error fetching quote:', error);
      alert('failed to fetch a quote');
    });
}

function showAnswer() {
  document.getElementById('js-answer-text').textContent = currentAnswer
    ? 'Answer: ' + currentAnswer
    : 'No question loaded yet';
}

newQuoteBtn.addEventListener('click', getQuote);
answerBtn.addEventListener('click', showAnswer);

getQuote();