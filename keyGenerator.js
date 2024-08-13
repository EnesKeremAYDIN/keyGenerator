const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let key = '';

  for (let i = 0; i < 4; i++) {
    if (i > 0) key += '-';
    for (let j = 0; j < 5; j++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      key += characters[randomIndex];
    }
  }

  return key;
}

function calculateExpiry(duration) {
  const now = new Date();
  const expiryDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1));

  if (unit === 'd') {
    expiryDate.setDate(expiryDate.getDate() + value);
  } else if (unit === 'm') {
    expiryDate.setMonth(expiryDate.getMonth() + value);
  } else {
    throw new Error('Invalid duration format');
  }

  return expiryDate;
}

function isExpired(expiryDate) {
  const now = new Date();
  return now > expiryDate;
}

function saveKeyToDatabase(key, startDate, expiryDate) {
  const dbPath = './keys.json';
  const data = {
    key: key,
    startDate: startDate,
    expireDate: expiryDate,
  };

  let db = [];

  if (fs.existsSync(dbPath)) {
    const existingData = fs.readFileSync(dbPath);
    db = JSON.parse(existingData);
  }

  db.push(data);

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function createKeyWithExpiry() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Please specify the validity duration (e.g., 2d or 1m): ', (duration) => {
    rl.close();

    try {
      const key = generateKey();
      const startDate = new Date();
      const expiryDate = calculateExpiry(duration);

      console.log(`Generated Key: ${key}`);
      console.log(`Start Date: ${startDate}`);
      console.log(`Expiry Date: ${expiryDate}`);

      if (isExpired(expiryDate)) {
        console.error('This key has expired.');
      } else {
        console.log('This key is valid.');
        saveKeyToDatabase(key, startDate, expiryDate);
        console.log('Key saved to database.');
      }
    } catch (error) {
      console.error('Error: ', error.message);
    }
  });
}

function checkKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Please enter the key to check: ', (inputKey) => {
    rl.close();

    const dbPath = './keys.json';

    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath));
      const foundKey = db.find(entry => entry.key === inputKey);

      if (foundKey) {
        console.log(`Key: ${foundKey.key}`);
        console.log(`Start Date: ${foundKey.startDate}`);
        console.log(`Expiry Date: ${foundKey.expireDate}`);

        if (isExpired(new Date(foundKey.expireDate))) {
          console.error('This key has expired.');
        } else {
          console.log('This key is valid.');
        }
      } else {
        console.error('Key not found in database.');
      }
    } else {
      console.error('No keys have been generated yet.');
    }
  });
}

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Would you like to "check" a key or "create" a new one? (check/create): ', (action) => {
    if (action === 'check') {
      checkKey();
    } else if (action === 'create') {
      createKeyWithExpiry();
    } else {
      console.error('Invalid option selected.');
      rl.close();
    }
  });
}

main();
