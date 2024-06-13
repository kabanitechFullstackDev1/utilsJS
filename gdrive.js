
const fs = require('fs');
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
                                                name: listFolders[i].name,
                                                id: listFolders[i].id
                                            },
                                            ...list
                                        );
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
                            async infoFolder => {
                                if (infoFolder) {
                                    await fnCreateDirectoryStructureInGDrive(drive, listNamesPathFoldersAtGoogleDrive.slice(1), infoFolder.id).then(
                                        list => {
                                            if (list) {
                                                listIdsWithNamesOfFolders.push(
                                                    {
                                                        name: infoFolder.name,
                                                        id: infoFolder.id
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
                            name: listFolders[0].name,
                            id: listFolders[0].id
                        });
                    } else {
                        await createFolder(drive, listNamesPathFoldersAtGoogleDrive[0], idRootFolder).then(
                            async infoFolder => {
                                listIdsWithNamesOfFolders.push({
                                    name: infoFolder.name,
                                    id: infoFolder.id
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

function fnListFiles(drive) {
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

// List files in Google Drive with parent's name and ID
async function fnListFilesWithParents(drive) {
    //const drive = google.drive({ version: DRIVE_API_VERSION, auth: jwtClient });
    try {
        const response = await drive.files.list({
            pageSize: 1000,
            fields: 'files(id, name, parents)',
        });
        console.log('Files:');
        response.data.files.forEach(async file => {
            const parents = file.parents || [];
            for (const parent of parents) {
                const parentInfo = await drive.files.get({
                    fileId: parent,
                    fields: 'id, name',
                });
                console.log(`File: ${file.name} (${file.id}) - Parent: ${parentInfo.data.name} (${parentInfo.data.id})`);
            }
        });
    } catch (error) {
        console.error('Error listing files:', error);
    }
}

async function fnListFilesTree(drive, parentId = 'root', indent = 0) {
    //const drive = google.drive({ version: DRIVE_API_VERSION, auth: jwtClient });
    try {
        // Fetch files and folders in the current parent folder
        const response = await drive.files.list({
            q: `'${parentId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
        });

        // Process each file/folder
        for (const item of response.data.files) {
            // Indent according to folder depth
            const indentation = ' '.repeat(indent * 4);

            // Print file/folder name
            console.log(`${indentation}${item.name}`);

            // If it's a folder, recursively list its contents
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                await fnListFilesTree(drive, item.id, indent + 1);
            }
        }
    } catch (error) {
        console.error('Error listing files:', error);
    }
}

async function fnListFilesTreeToJSON(drive, parentId = 'root') {
    //const drive = google.drive({ version: DRIVE_API_VERSION, auth: jwtClient });
    try {
        // Initialize tree object
        const tree = { name: 'root', id: parentId, children: [] };

        // Fetch files and folders in the current parent folder
        const response = await drive.files.list({
            q: `'${parentId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
        });

        // Process each file/folder
        for (const item of response.data.files) {
            // Create node object
            const node = { name: item.name, id: item.id };

            // If it's a folder, recursively list its contents
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                node.children = await fnListFilesTreeToJSON(drive, item.id);
            }

            // Add node to the tree
            tree.children.push(node);
        }

        return tree;
    } catch (error) {
        console.error('Error listing files:', error);
        return null;
    }
}

async function fnUploadFileWithReplace(drive, nameFile, pathFile, idParentFolder) {
    return new Promise(async (resolve, reject) => {
        await searchFile(drive, nameFile, idParentFolder).then(
            async infoFiles => {
                //console.log(infoFiles);
                if (!infoFiles) {
                    await uploadFile(drive, nameFile, pathFile, idParentFolder).then(
                        infoFileGDrive => {
                            //console.log(infoFile);
                            resolve(infoFileGDrive);
                        },
                        err => {
                            console.error(err);
                            reject(err);
                        }
                    );
                } else if (Array.isArray(infoFiles)) {
                    for (let i = 0; i < infoFiles.length; i++) {
                        await deleteFile(drive, infoFiles[i].id).then(
                            async isDone => {
                                if (isDone) {
                                    await uploadFile(drive, nameFile, pathFile, idParentFolder).then(
                                        infoFile => {
                                            // console.log(infoFile);
                                            resolve(infoFile);
                                        },
                                        err => {
                                            console.error(err);
                                            reject(err);
                                        }
                                    );
                                }
                            },
                            err => {
                                console.error(err);
                                reject(err);
                            }
                        );
                    }
                }
            },
            err => {
                console.error(err);
                reject(err);
            }
        );
    });
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
            //console.log("Uploading...", nameFile, pathFile, idParentFolder)
            drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name'
            }, (err, file) => {
                if (err) {
                    // Handle error
                    console.error(err);
                    reject(err);
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
            reject(err);
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

async function searchFile(drive, nameFile, idParentFolder) {
    return new Promise(async (resolve, reject) => {
        // Define the search query
        const query = `name='${nameFile}' ${idParentFolder === undefined ? '' : `and '${idParentFolder}' in parents`}`;
        //console.log(query);
        // Search for files
        await drive.files.list({
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
                    /*
                    files.forEach(file => {
                        console.log('Files found: ' + ", ID: " + file.id + ", Name: " + file.name);
                    });
                    */
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
                    console.log('Folder created in GDrive, Name: ' + file.data.name + ", ID: " + file.data.id);
                    resolve(file.data);
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
                if (response.data === "") {
                    //console.log(`File deleted successfully: ${JSON.stringify(response)}`);
                    resolve(true);
                }
            }
        });
    });
}

// Retrieve the storage quota information
async function getStorageQuota(drive) {
    //const drive = google.drive({ version: DRIVE_API_VERSION, auth: jwtClient });
    try {
        const response = await drive.about.get({
            fields: 'storageQuota',
        });
        const storageQuota = response.data.storageQuota;
        console.log('Storage Quota Information:');
        console.log(`- Total Storage: ${formatBytes(storageQuota.limit)}`);
        console.log(`- Used Storage: ${formatBytes(storageQuota.usage)}`);
        console.log(`- Remaining Storage: ${formatBytes(storageQuota.limit - storageQuota.usage)}`);
    } catch (error) {
        console.error('Error retrieving storage quota:', error);
    }
}

// Helper function to format bytes into human-readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    fnCreateDirectoryStructureInGDrive,
    fnUploadFileWithReplace,
    fnListFiles,
    fnListFilesWithParents,
    fnListFilesTree,
    fnListFilesTreeToJSON,
    getStorageQuota,
    searchFolder,
    searchFile,
    deleteFile
}