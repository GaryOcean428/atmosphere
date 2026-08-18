const fs = require('fs')
const path = require('path');

const filePath = path.join(__dirname, '..', 'scripts','pkg-executable','package.json');

const atmosphereSdkPackage = JSON.parse(fs.readFileSync(filePath, 'utf8'))

// downgrade sqlite3 to 5.1.6 until build related issues are resolved
// https://github.com/TryGhost/node-sqlite3/issues/1748
atmosphereSdkPackage.overrides = atmosphereSdkPackage.overrides || {};
atmosphereSdkPackage.overrides.sqlite3 =  "5.1.6"

fs.writeFileSync(filePath, JSON.stringify(atmosphereSdkPackage, null, 2), 'utf8');
