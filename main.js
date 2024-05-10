const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const {
	fnCreateDirectoryStructureInGDrive,
	fnUploadFileWithReplace,
	fnListFiles,
	fnListFilesWithParents,
	fnListFilesTree,
	fnListFilesTreeToJSON,
	getStorageQuota
} = require('./gdrive');

const nameClient = "fullstackdev1";
const pathCredentials = path.join(__dirname, 'gdrive', 'credentials', nameClient);

const credentialsGDrive = {
	"athulenergy": {
		nameKeyFile: 'athul-energy-kabanitech-54ea70cc98c4.json',
		nameRootFolderInGoogleDrive: "kemdes_uploads",
	},
	"fullstackdev1": {
		nameKeyFile: 'kio-drive-001-f415469f2ba3.json',
		nameRootFolderInGoogleDrive: "test_kemdes_uploads"
	}
}

const keyFile = fs.readFileSync(path.join(pathCredentials, credentialsGDrive[nameClient].nameKeyFile));
const key = JSON.parse(keyFile);

const rootFolderGDrive = credentialsGDrive[nameClient].nameRootFolderInGoogleDrive;

// Set up authentication
// Authenticate using the service account key
const authGDrive = new google.auth.GoogleAuth({
	credentials: key,
	scopes: 'https://www.googleapis.com/auth/drive'
});

const nameFile = 'device1_29-04-2024.xlsx';
const nameDirStatic = 'data';
const pathFileRelative = path.join('device1', '29-04-2024');
const pathFileAbsolute = path.join(nameDirStatic, pathFileRelative);
const pathGDrive = path.join(rootFolderGDrive, pathFileRelative);

const drive = google.drive({ version: 'v3', auth: authGDrive });
//fnListFiles(drive);
//fnListFilesWithParents(drive);
//fnListFilesTree(drive);
//getStorageQuota(drive);
fnCreateDirectoryStructureInGDrive(drive, pathGDrive.split('/'), 'root').then(list => console.log(JSON.stringify(list)));
/*
fnListFilesTreeToJSON(drive).then(tree => {
	const nameFile = 'filesGDriveTree.json'
	// Convert tree object to JSON and save to file
	fs.writeFileSync(`./${nameFile}`, JSON.stringify(tree, null, 2));
	console.log(`Tree structure saved to ${nameFile}`);
});
*/
//fnShare(drive, '1aXkboIuSCxqgmbMnS8lmztD_Gp-1J2a1', 'fullstackdev1.kabanitech@gmail.com');
//fnShare(drive, '1k0g12mVRdh9GCgg-ewCv6CmUeD9Xr3t4', 'sem.athul.kabani@gmail.com');
//fnSaveToDrive(nameFile, pathFileAbsolute, pathGDrive).then(infoFile => console.log(infoFile), err => console.error(err));

function fnCopy() {
	drive.files.copy({
		fileId: '1g4-8yQTj_6gcAs2c22o2-ibxsHuFgId3', // ID of the file created by the service account
		requestBody: {
			name: 'copy_of_kemdes_uploads'
		}
	}, (err, res) => {
		if (err) {
			console.error('Error copying file:', err);
			return;
		}
		console.log('File copied to user\'s drive.');
	});
}

function fnShare(drive, idFile, emailUser) {
	drive.permissions.create({
		fileId: idFile,
		requestBody: {
			role: 'writer', // Adjust the role as needed
			type: 'user',
			emailAddress: emailUser // User's email address
		}
	}, (err, res) => {
		if (err) {
			console.error('Error sharing file:', err);
			return;
		}
		console.log('File shared with user.');
	});
}

async function fnSaveToDrive(nameFile, pathFile, pathGDrive) {
	return new Promise(async (resolve, reject) => {
		const drive = google.drive({ version: 'v3', auth: authGDrive });
		const pathGDriveArray = pathGDrive.split('/');
		console.log(nameFile, pathFile, pathGDriveArray);
		await fnCreateDirectoryStructureInGDrive(drive, pathGDriveArray, 'root').then(
			async list => {
				if (list) {
					console.log(JSON.stringify(list));
					await fnUploadFileWithReplace(drive, nameFile, path.join(__dirname, pathFile), list.at(-1).id).then(
						infoFile => {
							//console.log(JSON.stringify(infoFile));
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
	});
}


