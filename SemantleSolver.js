const puppeteer = require('puppeteer');
const thesaurus = require("thesaurus");

const startingWord = "keyboard";

let guessedWords = new Set();
let thesaurusedWords = new Set();
let numGuessedWords = 0;
let nextWords = [startingWord];

function getWordNum(total, num) {
  if (total == 1) {
    return "#guesses > tbody > tr > td:nth-child(2)";
  } else {
    return "#guesses > tbody > tr:nth-child(" + (num+3) + ") > td:nth-child(2)";
  }
}

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

  bigLoop: while (await (await finalDialogBox.getProperty('className'))._remoteObject.value != "gaveup") {
    let nextWord = nextWords.pop();
    console.log(nextWord);
    guessedWords.add(nextWord);
    await input.type(nextWord);
    await page.waitForTimeout(10);
    await guessButton.click();
    await page.waitForTimeout(40);
    numGuessedWords++;

    let wordRank = 1;
    while(nextWords.length == 0) {
      let guessElement = await page.waitForSelector(getWordNum(numGuessedWords, wordRank));
      let wordAtRank = await (await guessElement.getProperty('textContent'))._remoteObject.value;
      if (!thesaurusedWords.has(wordAtRank)) {
        let newWords = thesaurus.find(wordAtRank);
        for (let word of newWords) {
          if (!guessedWords.has(word)) {
            nextWords.push(word);
          }
        }
        thesaurusedWords.add(wordAtRank);
      } else {
        wordRank++;
        if (wordRank == numGuessedWords) {
          console.log("Failed :(");
          break bigLoop;
        }
      }
    }

  }
  console.log("done!")

  await page.waitForTimeout(30000);
  browser.close()
}

solve();