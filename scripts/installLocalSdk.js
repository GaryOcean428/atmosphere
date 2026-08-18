const { exec } = require('child_process');
const path = require('path');
const sdkPath = path.join(__dirname, '..', 'packages', 'atmosphere-sdk');
const guiPath = path.join(__dirname, '..', 'packages', 'atmosphere-gui');
const atmospherePath = path.join(__dirname, '..', 'packages', 'atmosphere');

exec(`cd ${sdkPath} && pnpm i && npm run build`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error installing dependencies and building atmosphere-sdk: ${err}`);
      return;
    }
    
    console.log(`Dependencies installed and atmosphere-sdk built: ${stdout}`);

    const guiPromise = new Promise((resolve, reject) => {
      exec(`cd ${guiPath} && pnpm i ${sdkPath}`, (err, stdout, stderr) => {
        if (err) {
          reject(`Error installing dependencies for atmosphere-gui: ${err}`);
        } else {
          resolve(`Dependencies installed for atmosphere-gui: ${stdout}`);
        }
      });
    });
  
    const atmospherePromise = new Promise((resolve, reject) => {
      exec(`cd ${atmospherePath} && pnpm i ${sdkPath}`, (err, stdout, stderr) => {
        if (err) {
          reject(`Error installing dependencies for atmosphere: ${err}`);
        } else {
          resolve(`Dependencies installed for atmosphere: ${stdout}`);
        }
      });
    });

    Promise.all([guiPromise, atmospherePromise])
      .then((results) => {
        console.log(results.join('\n'));
      })
      .catch((err) => {
        console.error(err);
      });
  });