const path = require('path');

const { fnGetFoldersListAndFileNameFromFilePath } = require('./utils')

const parts = fnGetFoldersListAndFileNameFromFilePath(path.join(__dirname, 'test/device1/2024-04-25/device.xlsx'));
console.log(parts.validListFolders, parts.nameFile);
