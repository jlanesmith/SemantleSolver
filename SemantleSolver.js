const puppeteer = require('puppeteer');
const thesaurus = require("thesaurus");

const startingWord = "love";

let guessedWords = new Set();
let nextWords = [startingWord];
let wordsToThesaurize = [];

async function solve() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://semantle.novalis.org");
  await page.waitForTimeout(100);
  let guessButton = await page.waitForSelector("#guess-btn");
  let input = await page.waitForSelector("#guess");
  await page.click('#rules-close');
  await page.waitForTimeout(500);

  let finalDialogBox = await page.waitForSelector("#response");

  while (await (await finalDialogBox.getProperty('className'))._remoteObject.value != "gaveup") {

    // Guess word
    let nextWord = nextWords.pop();
    // console.log(nextWord);
    guessedWords.add(nextWord);
    await input.type(nextWord);
    await page.waitForTimeout(10);
    await guessButton.click();
    await page.waitForTimeout(50);

    // Add the guessed word to wordsToThesaurize
    let guessedWordElement = await page.waitForSelector("#guesses > tbody > tr > td:nth-child(2)");
    let guessedWord = await (await guessedWordElement.getProperty('textContent'))._remoteObject.value;
    if (nextWord == guessedWord) { // If the word is a valid, accepted word
      let numericalResultElement = await page.waitForSelector("#guesses > tbody > tr > td:nth-child(3)");
      let numericalResult = await (await numericalResultElement.getProperty('textContent'))._remoteObject.value;
      let i = 0;
      insert: for (; i < wordsToThesaurize.length; i++) {
        if (parseFloat(numericalResult) > parseFloat(wordsToThesaurize[i][1])) {
          wordsToThesaurize.splice(i, 0, [guessedWord, numericalResult]);
          break insert;
        }
      }
      if (i == wordsToThesaurize.length) {
        wordsToThesaurize.push([guessedWord, numericalResult])
      }
    }

    // Queue up the next words to guess
    while (nextWords.length == 0 && wordsToThesaurize.length > 0) {
      let newWords = thesaurus.find(wordsToThesaurize[0][0]);
      for (let word of newWords) {
        if (!guessedWords.has(word) && !word.includes(" ")) {
          nextWords.push(word);
        }
      }
      wordsToThesaurize.shift();
    }
  }
  console.log("done!")

  await page.waitForTimeout(60000);
  browser.close()
}

solve();
