/* a UDF library contains one or more javascript functions */

function traverse(query, connectTo, c1, connectFrom, result, debugProp) {

	let r_seed = [];
	let q = "";

	if (c1 != null) {
		q = query + " WHERE " + connectTo + "='" + c1 + "'";
	} else {
		q = query;
	}
	logMsg("traverse query = " + query, debugProp);

	q1 = N1QL(q);
	for (const doc of q1) {
		r_seed.push(doc);
	}
	// minimize the need for open iterator
	q1.close();


	for (const doc of r_seed) {
		if (doc[connectFrom] != null) {
			logMsg("result push " + JSON.stringify(doc), debugProp)
			result.push(doc);
			logMsg("Call traverse(r) with startWith " + doc[connectFrom], debugProp);
			result = traverse(query, connectTo, doc[connectFrom], connectFrom, result, debugProp);

		} else // root - stop traverse
		{
			logMsg("result push-last " + JSON.stringify(doc), debugProp);
			result.push(doc);
		}
	}

	return result;
}

function format_single(resultArr, startWith, hier_fld, connectTo, connectFrom, debugProp) {

	var h = [];

	for (var i = 1; i < resultArr.length; i++) {
		h[i - 1] = resultArr[i];
		h[i - 1].level = i;
	}

	var fomattedDoc = {
		[connectFrom]: resultArr[0][connectFrom],
		[connectTo]: resultArr[0][connectTo]
	};

	fomattedDoc[hier_fld] = h;
	return fomattedDoc;

}


function logMsg(msg, logProp) {

	if (logProp.logKS) {

		if (logProp.val == 0) {
			let query = "DELETE FROM " + logProp.logKS
				+ " WHERE udf='" + logProp.udfName + "'";

			var i = N1QL(query);
			// close iterator asap as best practice
			i.close();

		}
		let query = "INSERT INTO " + logProp.logKS
			+ " VALUES(UUID(), { 'line': " + ++logProp.val
			+ ", 'udf':"
			+ "'" + logProp.udfName + "'"
			+ ", 'msg':" + "'" + msg + "'" + " })";

		var i = N1QL(query);
		i.close();

	}
}

function initLog(logKSpace, udf) {

	var logProp = {
		val: 0,
		logKS: logKSpace,
		udfName: udf.split(new RegExp('[ (]', 'g'))[1]
	};
	return logProp;

}


function traverseTree(kSpace, startWith, connectTo, connectFrom, reportHier, debugKSpace) {

	var debugProp = initLog(debugKSpace, arguments.callee.toString());

	try {

		logMsg("startWith=" + startWith, debugProp);
		let result = [];
		let startArr = [];
		let resultArr = [];
		let fomattedDoc = {};

		let reportHierFld = reportHier ? reportHier : "Hierarchies";

		let query = "select " + connectTo + "," + connectFrom + " from " + kSpace;

		if (startWith) {

			resultArr = traverse(query,
				connectTo,
				startWith,
				connectFrom,
				resultArr,
				debugProp);

			logMsg("End traverse with=" + JSON.stringify(resultArr), debugProp);

			fomattedDoc = format_single(resultArr,
				startWith,
				reportHierFld,
				connectTo,
				connectFrom,
				debugProp);

			result.push(fomattedDoc);

		} else {
			logMsg("Traverse query startWith NULL" + query, debugProp);
			q = N1QL(query);

			for (const doc of q) {
				if (doc) {
					startArr.push(doc);
				}
			}
			q.close();

			for (const doc of startArr) {
				if (doc) {
					resultArr = [];
					resultArr = traverse(query,
						connectTo,
						doc[connectTo],
						connectFrom,
						resultArr,
						debugProp);
					fomattedDoc = format_single(resultArr,
						doc[connectFrom],
						reportHierFld,
						connectTo,
						connectFrom,
						debugProp);
					result.push(fomattedDoc);

				}
			}
		}
		return (result);
	}
	catch (e) {
		logMsg("Error =" + e, debugProp);
		return "Error...";
	}
}

