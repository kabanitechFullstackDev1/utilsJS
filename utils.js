
const path = require("node:path");
const fs = require('fs');

// log as alias for console.log, i.e: log() may be used instead of console.log()
const log = obj => console.log(obj);

function fnIncludePrefixToConsole(dirname) {
	log(`Log file at: '${dirname}'`);
	// Code For Inserting line number prefix to console.log strings
	//Reference: https://stackoverflow.com/a/47296370/23289934
	['debug', 'log', 'warn', 'error'].forEach((methodName) => {
		const originalLoggingMethod = console[methodName];
		console[methodName] = (firstArgument, ...otherArguments) => {
			const originalPrepareStackTrace = Error.prepareStackTrace;
			Error.prepareStackTrace = (_, stack) => stack;
			const callee = new Error().stack[1];
			Error.prepareStackTrace = originalPrepareStackTrace;
			const relativeFileName = path.relative(process.cwd(), callee.getFileName());
			const prefix = `${fnDateTimeStampString().dateTimeStampWithDelimiters.substring(11)} ${relativeFileName}:${callee.getLineNumber()}:`;
			if (!fs.existsSync(dirname)) {
				fs.mkdirSync(dirname);
			}

			const strDate = fnDateTimeStampString().dateTimeStampNoDelimiters;
			const strYear = strDate.substring(0, 4);
			const strMonth = strDate.substring(4, 6);
			const strDay = strDate.substring(6, 8);
			const strNameFileLog = `${strYear}-${strMonth}-${strDay}.log`;
			let strOtherArgs = JSON.stringify(firstArgument);
			otherArguments.forEach(args => {
				strOtherArgs += ", " + JSON.stringify(args);
			});
			fnUpdateLogFile(path.join(dirname, strNameFileLog), prefix + ' ' + strOtherArgs, "append");
			if (typeof firstArgument === 'string') {
				originalLoggingMethod(prefix + ' ' + firstArgument, ...otherArguments);
			} else {
				originalLoggingMethod(prefix, firstArgument, ...otherArguments);
			}
		};
	});
}

function fnUpdateLogFile(pathFileLog, strLog, mode) {
	if (!fs.existsSync(pathFileLog)) {
		fs.writeFile(pathFileLog, strLog + "\n", { flag: 'wx' }, function (err) {
			if (err) throw err;
			//log(`Log File: ${pathFileLog}`);
			return;
		});
	} else {
		if (mode === "append") {
			fs.appendFile(pathFileLog, strLog + "\n", function (err) {
				if (err) throw err;
				//log('Saved!');
			});
		} else if (mode === "prepend") {

			//https://stackoverflow.com/a/49889780
			const data = fs.readFileSync(pathFileLog);
			const fd = fs.openSync(pathFileLog, 'w+');
			const insert = Buffer.from(strLog + "\n");
			fs.writeSync(fd, insert, 0, insert.length, 0);
			fs.writeSync(fd, data, 0, data.length, insert.length);
			fs.close(fd, (err) => {
				if (err) throw err;
			});
			/*
			const readStream = fs.createReadStream(pathFileLog);
			const writeStream = fs.createWriteStream(pathFileLog, { flags: 'w+' });

			writeStream.write(strLog + "\n");
			readStream.pipe(writeStream);
			
			writeStream.on('close', () => {
				//console.log('Write operation complete');
			});
			
			writeStream.on('error', (err) => {
				console.error('Error writing to file:', err);
			});

			readStream.on('error', (err) => {
				console.error('Error reading from file:', err);
			});
			*/
		}
	}
}

function fnZeroPad(num, len) {
	var numStr = num.toString();
	var digitsZero = "";
	var lenNumStr = numStr.length;
	var diffLen = len - lenNumStr;
	for (let i = 0; i < diffLen; i++) {
		digitsZero += '0';
	}
	numStr = digitsZero + numStr;
	return numStr;
}

function fnTsStr() {
	var dT = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' }));
	const dTEpoch = Date.now();
	dT.setMilliseconds(dTEpoch - dT.getMilliseconds());
	var dateTimeStamp = dT.getFullYear() + "-" + fnZeroPad(dT.getMonth() + 1, 2) + "-" + fnZeroPad(dT.getDate(), 2) + "|" + fnZeroPad(dT.getHours(), 2) + ":" + fnZeroPad(dT.getMinutes(), 2) + ":" + fnZeroPad(dT.getSeconds(), 2) + "." + fnZeroPad(dT.getMilliseconds(), 3);
	return dateTimeStamp;
}

function fnDateTimeStampString() {
	//const dT = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' }));
	const dT = new Date();
	//log(dT.getTimezoneOffset());
	const dTEpoch = Date.now();
	return {
		dateTimeStampWithDelimiters: `${dT.getFullYear()}-${fnZeroPad(dT.getMonth() + 1, 2)}-${fnZeroPad(dT.getDate(), 2)}_${fnZeroPad(dT.getHours(), 2)}:${fnZeroPad(dT.getMinutes(), 2)}:${fnZeroPad(dT.getSeconds(), 2)}.${fnZeroPad(dT.getMilliseconds(), 3)}`,
		dateTimeStampNoDelimiters: `${dT.getFullYear()}${fnZeroPad(dT.getMonth() + 1, 2)}${fnZeroPad(dT.getDate(), 2)}${fnZeroPad(dT.getHours(), 2)}${fnZeroPad(dT.getMinutes(), 2)}${fnZeroPad(dT.getSeconds(), 2)}${fnZeroPad(dT.getMilliseconds(), 3)}`,
		timeStamp: `${fnZeroPad(dT.getHours(), 2)}:${fnZeroPad(dT.getMinutes(), 2)}:${fnZeroPad(dT.getSeconds(), 2)}.${fnZeroPad(dT.getMilliseconds(), 3)}`
	}
}

function fnParseTime(strTime, separator) {
	let hours = parseInt(strTime.split(separator)[0]);
	const minutes = parseInt(strTime.split(separator)[1]);
	const seconds = parseInt(strTime.split(separator)[2].substring(0, 2));
	if (strTime.substring(strTime.length - 2, strTime.length) === "am") {
		hours = (hours == 12) ? 0 : hours;
	} else {
		hours += (hours < 12) ? 12 : 0;
	}
	const dT = new Date();
	dT.setHours(hours);
	dT.setMinutes(minutes);
	dT.setSeconds(seconds);
	return dT;
}

//https://stackoverflow.com/a/8888498
function fnFmtAMPM(dt) {
	var hours = dt.getHours();
	var minutes = dt.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	var strTime = fnZeroPad(hours, 2) + ':' + fnZeroPad(minutes, 2) + ':' + fnZeroPad(dt.getSeconds(), 2) + ' ' + ampm;
	return strTime;
}

function fnFmtDate(dt, format, separator, isZeroPadding) {
	var year = dt.getFullYear();
	var month = dt.getMonth() + 1;
	var day = dt.getDate();
	let strDateFormatted = ""
	if (isZeroPadding) {
		month = fnZeroPad(month, 2);
		day = fnZeroPad(day, 2);
	}
	switch (format) {
		case "DDMMYYYY":
			strDateFormatted = `${day}${separator}${month}${separator}${year}`;
			break;
		case "YYYYMMDD":
			strDateFormatted = `${year}${separator}${month}${separator}${day}`;
			break;
	};
	//log(strDateFormatted);
	return strDateFormatted;
}

function fnParseDate(strDate, format, separator) {
	var year, month, day;
	//log(`${strDate}, ${format}, ${separator}`);
	switch (format) {
		case "DDMMYYYY":
			day = parseInt(strDate.split(separator)[0]);
			month = parseInt(strDate.split(separator)[1]) - 1;
			year = parseInt(strDate.split(separator)[2]);
			break;
		case "YYYYMMDD":
			year = parseInt(strDate.split(separator)[0]);
			month = parseInt(strDate.split(separator)[1]) - 1;
			day = parseInt(strDate.split(separator)[2]);
			break;
	};
	const dt = new Date();
	dt.setFullYear(year, month, day);
	//log(`${year}, ${month}, ${day}`);
	return dt;
}

function fnIsDateValid(strDate) {
	if (isNaN(new Date(strDate))) {
		return false;
	}
	return true;
}

function fnIsToday(dt) {
	let dtToday = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' }));
	if ((dt.getDate() === dtToday.getDate()) && (dt.getMonth() === dtToday.getMonth() && (dt.getFullYear() === dtToday.getFullYear()))) {
		log("Date " + fnFmtDate(dt, "YYYYMMDD", "-") + " is Today's")
		return true;
	}
	//log("Date " + fnFmtDate(dt, "YYYYMMDD", "-") + " is not Today's")
	return false;
}

function fnIsYesterday(dt) {
	const dtToday = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' }));
	let dateYesterday = dtToday;
	dateYesterday.setTime(dtToday.getTime() - (24 * 60 * 60 * 1000));
	//log(dateYesterday.getDate() + " " + dateYesterday.getMonth() + " " + dateYesterday.getFullYear());
	if ((dt.getDate() === dateYesterday.getDate()) && (dt.getMonth() === dateYesterday.getMonth() && (dt.getFullYear() === dateYesterday.getFullYear()))) {
		log("Date " + fnFmtDate(dt, "YYYYMMDD", "-") + " is Yesterday's")
		return true;
	}
	//log("Date " + fnFmtDate(dt, "YYYYMMDD", "-") + " is not Yesterday's")
	return false;
}

function fnGetDateStringsListBetweenTwoDateStrings(strDateFrom, strDateTo, formatStrDate, separatorStrDate) {
	let dateFrom = fnParseDate(strDateFrom, formatStrDate, separatorStrDate);
	let dateTo = fnParseDate(strDateTo, formatStrDate, separatorStrDate);
	let datesStringsList = [];
	let dt = new Date();
	for (dt.setTime(dateFrom.getTime()); dt.getTime() <= dateTo.getTime(); dt.setDate(dt.getDate() + 1)) {
		let month = dt.getMonth() + 1;
		//log(dt.getDate() + separatorStrDate + month + separatorStrDate + dt.getFullYear())
		if (formatStrDate == "DDMMYYYY") {
			datesStringsList.push(dt.getDate() + separatorStrDate + month + separatorStrDate + dt.getFullYear());
		} else if (formatStrDate == "YYYYMMDD") {
			datesStringsList.push(dt.getFullYear() + separatorStrDate + month + separatorStrDate + dt.getDate());
		}
	};
	//log("Dates strings List: " + datesStringsList);
	return datesStringsList;
}

async function fnReadJSONFile(nameFileWithPath) {
	return new Promise((fnSuccess, fnFailure) => {
		try {
			let rawdata = fs.readFileSync(nameFileWithPath);
			let dataJSON = JSON.parse(rawdata);
			//log(`${nameFileWithPath} loaded as ${rawdata}`);
			fnSuccess(dataJSON);
		} catch (e) {
			log(e.toString());
			fnFailure();
		}
	});
}

async function fnWriteJSONFile(nameFileWithPath, dataJSON) {
	return new Promise((fnSuccess, fnFailure) => {
		try {
			let data = JSON.stringify(dataJSON);
			fs.writeFileSync(nameFileWithPath, data);
			if (fs.existsSync(nameFileWithPath)) {
				//log(`${data} saved as ${nameFileWithPath}`);
				fnSuccess(dataJSON);
			} else {
				log(`File not found!!! ${nameFileWithPath}`);
				fnFailure();
			}
		} catch (e) {
			log(e.toString());
			fnFailure();
		}
	})
}

function fnIsJSON(data) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

function fnGetFoldersListAndFileNameFromFilePath(nameFileWithPath) {
	let listFolders = false;
	let nameFile = false;
	if (!fnIsArrayElementsEmpty(nameFileWithPath.split('/'))) {
		const parts = nameFileWithPath.split('/');
		const tStr = parts.at(-1);
		const partsTStr = tStr.split('.');
		//console.log(partsTStr);
		if (!fnIsArrayElementsEmpty(partsTStr)) {
			nameFile = parts.at(-1);
			listFolders = parts.slice(0, parts.length - 1);
		} else {

			listFolders = parts;
		}
	}
	return { validListFolders: Array.isArray(listFolders) ? fnSanitizeListFolders(listFolders) : false, nameFile: nameFile };
}

function fnIsArrayElementsEmpty(array) {
	let isEmpty = true;
	array.forEach(element => {
		if (element.length > 0) {
			isEmpty = false;
		}
	});
	return isEmpty;
}

function fnSanitizeListFolders(listFolders) {
	let validListFolders = [];
	listFolders.forEach(nameFolder => {
		// Remove invalid characters
		nameFolder = nameFolder.replace(/[<>:"/\\|?*]/g, '_');

		// Remove leading and trailing periods
		nameFolder = nameFolder.replace(/^\.+|\.+$/g, '');
		if (nameFolder !== "") {
			validListFolders.push(nameFolder);
		}
	});
	return validListFolders;
}

module.exports = {
	log,
	fnGetFoldersListAndFileNameFromFilePath,
	fnUpdateLogFile,
	fnIncludePrefixToConsole,
	fnZeroPad,
	fnTsStr,
	fnDateTimeStampString,
	fnParseTime,
	fnFmtAMPM,
	fnParseDate,
	fnIsDateValid,
	fnIsToday,
	fnIsYesterday,
	fnIsJSON,
	fnFmtDate,
	fnGetDateStringsListBetweenTwoDateStrings,
	fnReadJSONFile,
	fnWriteJSONFile
}