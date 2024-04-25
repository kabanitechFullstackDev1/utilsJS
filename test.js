const { fnGetFoldersListAndFileNameFromFilePath } = require('./utils')

const parts = fnGetFoldersListAndFileNameFromFilePath('/test/device1/2024-04-25/file.txt')
console.log(parts[0], parts[1]);

function fnCreateFileWithFoldersInPathIfNotExists(nameFile, pathFile) {
    [listFolders, nameFileInPathFile] = fnGetFoldersListAndFileNameFromFilePath(pathFile);
    
}