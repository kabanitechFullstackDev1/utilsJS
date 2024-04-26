
const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function fnCreateDirectoryStructureInGDrive(drive, listNamesPathFoldersAtGoogleDrive, idRootFolder) {
    return new Promise(async (resolve, reject) => {
        //console.log(listNamesPathFoldersAtGoogleDrive);
        let listIdsWithNamesOfFolders = [];
        if (listNamesPathFoldersAtGoogleDrive.length > 1) {
            await searchFolder(drive, listNamesPathFoldersAtGoogleDrive[0], idRootFolder).then(
                async listFolders => {
                    if (Array.isArray(listFolders)) {
                        for (let i = 0; i < listFolders.length; i++) {
                            await fnCreateDirectoryStructureInGDrive(drive, listNamesPathFoldersAtGoogleDrive.slice(1), listFolders[i].id).then(
                                list => {
                                    if (list) {
                                        listIdsWithNamesOfFolders.push(
                                            {
                                                name: listNamesPathFoldersAtGoogleDrive[0],
                                                id: listFolders[i].id
                                            },
                                            ...list
                                        );
                                    } else {

                                    }
                                },
                                err => {
                                    console.error(err);
                                    reject(err);
                                }
                            )
                        }
                    } else {
                        await createFolder(drive, listNamesPathFoldersAtGoogleDrive[0], idRootFolder).then(
                            async idFolder => {
                                if (idFolder) {
                                    await fnCreateDirectoryStructureInGDrive(drive, listNamesPathFoldersAtGoogleDrive.slice(1), idFolder).then(
                                        list => {
                                            if (list) {
                                                listIdsWithNamesOfFolders.push(
                                                    {
                                                        name: listNamesPathFoldersAtGoogleDrive[0],
                                                        id: idFolder
                                                    },
                                                    ...list
                                                );
                                            } else {

                                            }
                                        },
                                        err => {
                                            console.error(err);
                                            reject(err);
                                        }
                                    )
                                }
                            },
                            err => {
                                console.error(err);
                                reject(err);
                            }
                        )
                    }
                },
                err => {
                    console.error(err);
                    reject(err);
                }
            );
        } else if (Array.isArray(listNamesPathFoldersAtGoogleDrive) && listNamesPathFoldersAtGoogleDrive.length > 0) {
            await searchFolder(drive, listNamesPathFoldersAtGoogleDrive[0], idRootFolder).then(
                async listFolders => {
                    if (Array.isArray(listFolders)) {
                        listIdsWithNamesOfFolders.push({
                            name: listNamesPathFoldersAtGoogleDrive[0],
                            id: listFolders[0].id
                        });
                    } else {
                        await createFolder(drive, listNamesPathFoldersAtGoogleDrive[0], idRootFolder).then(
                            async idFolder => {
                                listIdsWithNamesOfFolders.push({
                                    name: listNamesPathFoldersAtGoogleDrive[0],
                                    id: idFolder
                                });
                            },
                            err => {
                                console.error(err);
                                reject(err);
                            }
                        )
                    }
                }
            );
        }
        if (Array.isArray(listIdsWithNamesOfFolders) && listIdsWithNamesOfFolders.length === listNamesPathFoldersAtGoogleDrive.length) {
            resolve(listIdsWithNamesOfFolders)
        }
        resolve(false);
    });
}

function getAccessToken(oAuth2Client, pathToken) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(pathToken, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
        });
    });
}

function listFiles(drive) {
    drive.files.list({
        pageSize: 200,
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }
    });
}

async function fnUploadFileWithReplace(drive, nameFile, pathFile, idParentFolder) {
    await searchFile(drive, nameFile).then(
        async infoFiles => {
            //console.log(infoFiles);
            if (!infoFiles) {
                await uploadFile(drive, nameFile, pathFile, idParentFolder).then(
                    idFile => console.log(idFile),
                    err => console.error(err)
                );
            } else if (Array.isArray(infoFiles)) {
                for (let i = 0; i < infoFiles.length; i++) {
                    await deleteFile(drive, infoFiles[i].id);
                }
                await uploadFile(drive, nameFile, pathFile, idParentFolder).then(
                    idFile => console.log(idFile),
                    err => console.error(err)
                );
            }
        },
        err => console.error(err)
    );
}

function uploadFile(drive, nameFile, pathFile, idParentFolder) {
    return new Promise((resolve, reject) => {
        try {
            const fileMetadata = {
                'name': `${nameFile}`,
                'parents': [idParentFolder]
            };

            // Specify the file path
            const filePath = path.join(pathFile, nameFile); // Change this to the path of your file

            const fileSize = fs.statSync(filePath).size;

            // Create the readable stream for the file
            const fileStream = fs.createReadStream(filePath);

            const media = {
                body: fileStream
            };
            drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name'
            }, (err, file) => {
                if (err) {
                    // Handle error
                    console.error(err);
                } else {
                    //console.log('Upload Successfull, File Id:', file.data.id);
                    resolve(file.data);
                }
            });
            let uploadedBytes = 0;
            // Monitor the upload progress
            fileStream.on('data', (chunk) => {
                uploadedBytes += chunk.length;
                const percentUploaded = (uploadedBytes / fileSize) * 100;
                //console.log('Uploaded:', percentUploaded.toFixed(2), '%');
            });

            fileStream.on('end', () => {
                //console.log('Upload completed');
            });

            fileStream.on('error', (err) => {
                console.error('Error uploading file:', err);
                reject(err);
            });
        } catch (err) {
            console.error(err);
        }
    });

}

async function searchFolder(drive, nameFolder, idParentFolder) {
    //console.log(nameFolder, idParentFolder);
    return new Promise((resolve, reject) => {
        const query = `name='${nameFolder}' ${idParentFolder === undefined ? '' : `and '${idParentFolder}' in parents`} and mimeType='application/vnd.google-apps.folder'`
        drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        }, (err, res) => {
            if (err) {
                console.error('Error listing folders:', err);
                reject(err);
            } else {
                const folders = res.data.files;
                if (Array.isArray(folders) && folders.length === 0) {
                    // Folder does not exist
                    //console.log('Folder does not exists');
                    resolve(false);
                } else {
                    // Folder already exists
                    //console.log('Folder already exists:', folders[0].name, folders[0].id);
                    resolve(folders);
                }
            }
        });
    });
}

function searchFile(drive, nameFile, idParentFolder) {
    return new Promise((resolve, reject) => {
        // Define the search query
        const query = `name='${nameFile}' ${idParentFolder === undefined ? '' : `and '${idParentFolder}' in parents`}`;
        // Search for files
        drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        }, (err, res) => {
            if (err) {
                console.error('Error searching for files:', err);
                reject(err);
            } else {
                const files = res.data.files;
                if (Array.isArray(files) && files.length === 0) {
                    //console.log('No files found.');
                    resolve(false)
                } else {
                    //console.log('Files found: ' + files.length);
                    resolve(files);
                }
            }
        });
    });
}

function createFolder(drive, nameFolder, idParentFolder) {
    return new Promise((resolve, reject) => {
        // Create folder metadata
        const folderMetadata = {
            'name': nameFolder,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [idParentFolder]
        };

        // Create the folder
        drive.files.create({
            resource: folderMetadata,
            fields: 'id, name'
        }, (err, file) => {
            if (err) {
                console.error('Error creating folder:', err);
                reject(err);
            } else {
                if (file.data.id != "") {
                    console.log('Folder created, Name: ' + file.data.name + ", ID: " + file.data.id);
                    resolve(file.data.id);
                } else {
                    resolve(false);
                }
            }
        });

    });
}

function deleteFile(drive, idFile) {
    return new Promise((resolve, reject) => {
        // Delete the file
        drive.files.delete({
            fileId: idFile
        }, (err, response) => {
            if (err) {
                console.error('Error deleting file:', err);
                reject(err);
            } else {
                //console.log('File deleted successfully');
                resolve(true);
            }
        });
    });
}

module.exports = {
    fnCreateDirectoryStructureInGDrive,
    fnUploadFileWithReplace
}