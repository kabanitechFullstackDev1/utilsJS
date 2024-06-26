
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
		console[methodName] = async (firstArgument, ...otherArguments) => {
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
			const strHour = strDate.substring(8, 10);
			const strNameFileLog = `${strYear}-${strMonth}-${strDay}_${strHour}.log`;
			let strOtherArgs = JSON.stringify(firstArgument);
			otherArguments.forEach(args => {
				strOtherArgs += ", " + JSON.stringify(args);
			});
			await fnUpdateLogFile(path.join(dirname, strNameFileLog), prefix + ' ' + strOtherArgs, "append");
			if (typeof firstArgument === 'string') {
				originalLoggingMethod(prefix + ' ' + firstArgument, ...otherArguments);
			} else {
				originalLoggingMethod(prefix, firstArgument, ...otherArguments);
			}
		};
	});
}

async function fnUpdateLogFile(pathFileLog, strLog, mode) {
	if (!fs.existsSync(pathFileLog)) {
		fs.writeFile(pathFileLog, strLog + "\n", { flag: 'wx' }, function (err) {
			if (err) {
				console.error(err.message);
			}
			return;
		});
	} else {
		if (mode === "append") {
			fs.appendFile(pathFileLog, strLog + "\n", function (err) {
				if (err) {
					console.error(err.message);
				}
			});
		} else if (mode === "prepend") {

			//https://stackoverflow.com/a/49889780
			const data = fs.readFileSync(pathFileLog);
			const fd = fs.openSync(pathFileLog, 'w+');
			const insert = Buffer.from(strLog + "\n");
			fs.writeSync(fd, insert, 0, insert.length, 0);
			fs.writeSync(fd, data, 0, data.length, insert.length);
			fs.close(fd, (err) => {
				if (err) {
					console.error(err.message);
				}
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

function fnIsValidDateTimeStamp(timestamp) {
	if ((timestamp instanceof string) && timestamp.length > 11) {
		//const strTSIST = strTSUTC.slice(0, strTSUTC.length - 1) + "-05:30";
		//console.log(strTSIST);
		const dt = new Date(strTSUTC);
		return dt;
	} else if (timestamp instanceof number) {
		const dt = new Date(timestamp);
		return dt;
	} else {
		strTime = timestamp;
	}
}

function fnParseTime(timestamp, separator) {
	let strTime = "";
	//console.log(timestamp);
	try {
		if ((typeof (timestamp) === "string") && timestamp.length > 11) {
			//const strTSIST = strTSUTC.slice(0, strTSUTC.length - 1) + "-05:30";
			//console.log(strTSIST);
			const dt = new Date(strTSUTC);
			return dt;
		} else if (!isNaN(timestamp)) {
			const dt = new Date(timestamp);
			return dt;
		} else if ((typeof (timestamp) === "string")) {
			strTime = timestamp;
		}
		const strTimeParts = strTime.split(separator);
		let hours = parseInt(strTimeParts[0]);
		const minutes = parseInt(strTimeParts[1]);
		const seconds = parseInt(strTimeParts[2].substring(0, 2));
		/*
		if (strTime.substring(strTime.length - 2, strTime.length) === "am") {
			hours = (hours == 12) ? 0 : hours;
		} else {
			hours += (hours < 12) ? 12 : 0;
		}
		*/
		const dT = new Date();
		dT.setHours(hours);
		dT.setMinutes(minutes);
		dT.setSeconds(seconds);
		dT.setMilliseconds(0);
		return dT;
	} catch (err) {
		console.log(err.message, strTime);
	}
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
	const strDateParts = strDate.split(separator);
	//log(`${strDate}, ${format}, ${separator}`);
	switch (format) {
		case "DDMMYYYY":
			day = parseInt(strDateParts[0]);
			month = parseInt(strDateParts[1]) - 1;
			year = parseInt(strDateParts[2]);
			break;
		case "YYYYMMDD":
			year = parseInt(strDateParts[0]);
			month = parseInt(strDateParts[1]) - 1;
			day = parseInt(strDateParts[2]);
			break;
	};
	const dt = new Date();
	dt.setFullYear(year, month, day);
	//log(`${year}, ${month}, ${day}`);
	return dt;
}

function fnIsDateValid(strDate) {
	if (isNaN(new Date(strDate))) {
		console.log(`Invalid Date: '${strDate}`)
		return false;
	}
	return true;
}

function fnIsToday(dt) {
	let dtToday = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' }));
	if ((dt.getDate() === dtToday.getDate()) && (dt.getMonth() === dtToday.getMonth() && (dt.getFullYear() === dtToday.getFullYear()))) {
		//log("Date " + fnFmtDate(dt, "YYYYMMDD", "-") + " is Today's")
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
			if (fs.existsSync(nameFileWithPath)) {
				let rawdata = fs.readFileSync(nameFileWithPath);
				let dataJSON = JSON.parse(rawdata);
				//log(`${nameFileWithPath} loaded as ${rawdata}`);
				fnSuccess(dataJSON);
			} else {
				log(`${nameFileWithPath} not found!`);
				fnSuccess(false);
			}
		} catch (e) {
			console.error(e);
			fnFailure(e);
		}
	});
}

async function fnWriteJSONFile(nameFileWithPath, dataJSON) {
	return new Promise((fnSuccess, fnFailure) => {
		try {
			let data = JSON.stringify(dataJSON);
			const nameFile = (nameFileWithPath.split(path.sep)).at(-1);
			const pathFile = nameFileWithPath.replace(nameFile, "");
			// Ensure destination directory exists
			fs.mkdir(pathFile, { recursive: true }, (err) => {
				if (err) {
					console.error('Error creating directory:', err);
					fnFailure(err);
				} else {
					//console.log('Destination directory created successfully!');
					fs.writeFileSync(nameFileWithPath, data);
					if (fs.existsSync(nameFileWithPath)) {
						//log(`${data} saved as ${nameFileWithPath}`);
						fnSuccess(nameFileWithPath);
					} else {
						log(`File not found!!! ${nameFileWithPath}`);
						fnFailure(new Error(`File not found!!! ${nameFileWithPath}`));
					}
				}
			});
		} catch (e) {
			console.error(e);
			fnFailure(e);
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

function fnIsValidISODateTime(isoString) {
	// Regular expression to validate ISO 8601 date-time format
	const isoRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[\+\-]\d{2}:\d{2}))$/;

	// Check if the string matches the ISO 8601 format
	if (!isoRegex.test(isoString)) {
		return false;
	}

	// Parse the date string using the Date constructor
	const date = new Date(isoString);

	// Check if the parsed date is valid
	if (isNaN(date.getTime())) {
		return false;
	}

	// Ensure the string produces the same date string in ISO format
	return date.toISOString() === isoString;
}

function fnConvertFloatMinutesToTimeString(floatMinutes) {
	// Ensure the input is a valid number
	if (isNaN(floatMinutes)) {
		throw new Error("Input must be a valid number");
	}

	// Extract the integer part for minutes
	let minutes = Math.floor(floatMinutes);

	// Extract the fractional part and convert to seconds
	let seconds = Math.round((floatMinutes - minutes) * 60);

	// Adjust for rounding issues that push seconds to 60
	if (seconds === 60) {
		seconds = 0;
		minutes += 1;
	}

	// Zero padding the values
	//const paddedMinutes = String(minutes).padStart(2, '0');
	//const paddedSeconds = String(seconds).padStart(2, '0');

	// Construct the final string
	const strTimeString = `${minutes > 0 ? minutes === 1 ? minutes + " minute " : minutes + " minutes " : ""}${seconds > 0 ? seconds === 1 ? seconds + " second " : seconds + " seconds " : ""}`;
	return strTimeString;
}

function fnFloatToPaddedString(floatValue, integerLength = 2, fractionLength = 2) {
	// Ensure the input is a valid number
	if (isNaN(floatValue)) {
		throw new Error("Input must be a valid number");
	}

	// Separate the integer and fractional parts
	const integerPart = Math.floor(floatValue);
	const fractionalPart = floatValue - integerPart;

	// Convert integer part to a zero-padded string
	const paddedIntegerPart = String(integerPart).padStart(integerLength, '0');

	// Convert fractional part to a zero-padded string
	// Using toFixed to ensure correct number of decimal places, then slice to remove "0."
	const paddedFractionalPart = String(fractionalPart.toFixed(fractionLength)).slice(2);

	// Construct the final padded string
	return `${paddedIntegerPart}.${paddedFractionalPart}`;
}

function fnFmtFloatWithZeroPad(numFloat, nDecimalDigits, nTotalDigits) {
	let formattedNumber = numFloat.toFixed(nDecimalDigits);  // Ensures single digit precision
	return formattedNumber.padStart(nTotalDigits, '0');  // Pads with zeros to ensure at least nTotalDigits characters (including the decimal point)
}


module.exports = {
	log,
	fnGetFoldersListAndFileNameFromFilePath,
	fnUpdateLogFile,
	fnIncludePrefixToConsole,
	fnZeroPad,
	fnTsStr,
	fnDateTimeStampString,
	fnIsValidISODateTime,
	fnParseTime,
	fnFmtAMPM,
	fnConvertFloatMinutesToTimeString,
	fnParseDate,
	fnIsDateValid,
	fnIsToday,
	fnIsYesterday,
	fnIsJSON,
	fnFmtDate,
	fnGetDateStringsListBetweenTwoDateStrings,
	fnReadJSONFile,
	fnWriteJSONFile,
	fnFmtFloatWithZeroPad
}