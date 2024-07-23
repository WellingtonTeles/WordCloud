const fs = require("fs");
const path = require("path");
const async = require("async");

// Function to read and process a single file
function processFile(filePath, callback) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return callback(err);
    }
    const words = data.toLowerCase().match(/\b\w+\b/g);
    const wordCount = {};

    words.forEach((word) => {
      if (wordCount[word]) {
        wordCount[word]++;
      } else {
        wordCount[word] = 1;
      }
    });

    callback(null, wordCount);
  });
}

// Function to merge word counts from multiple files
function mergeWordCounts(countsArray) {
  return countsArray.reduce((acc, curr) => {
    for (let word in curr) {
      if (acc[word]) {
        acc[word] += curr[word];
      } else {
        acc[word] = curr[word];
      }
    }
    return acc;
  }, {});
}

// Function to calculate font sizes
function calculateFontSizes(wordCount) {
  const maxFrequency = Math.max(...Object.values(wordCount));
  const wordList = [];

  for (let word in wordCount) {
    if (wordCount[word] > 1) {
      let fontSize;
      if (wordCount[word] === maxFrequency) {
        fontSize = "Huge";
      } else if (wordCount[word] > maxFrequency * 0.6) {
        fontSize = "Big";
      } else if (wordCount[word] > maxFrequency * 0.3) {
        fontSize = "Normal";
      } else {
        fontSize = "Small";
      }
      wordList.push({ word, count: wordCount[word], size: fontSize });
    }
  }

  return wordList.sort((a, b) => b.count - a.count);
}

// Main function to read files and generate word cloud data
function generateWordCloud(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return console.error("Error reading directory:", err);
    }

    const textFiles = files.filter((file) => path.extname(file) === ".txt");
    const tasks = textFiles.map((file) => {
      return async.apply(processFile, path.join(folderPath, file));
    });

    async.parallel(tasks, (err, results) => {
      if (err) {
        return console.error("Error processing files:", err);
      }

      const mergedCounts = mergeWordCounts(results);
      const wordCloudData = calculateFontSizes(mergedCounts);

      // Output to a text file
      const outputFilePath = path.join(folderPath, "wordcloud_output.txt");
      const outputData = wordCloudData
        .map((item) => `${item.word} ${item.count} ${item.size}`)
        .join("\n");

      fs.writeFile(outputFilePath, outputData, "utf8", (err) => {
        if (err) {
          return console.error("Error writing output file:", err);
        }
        console.log("Word cloud data has been written to", outputFilePath);
      });
    });
  });
}

// Specify the folder containing text files
const folderPath = "./texts"; // Change to your folder path

generateWordCloud(folderPath);
