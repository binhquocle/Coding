// https://www.geeksforgeeks.org/implementation-graph-javascript/
// Adapted from the above source for Couchbase UDF
// A directed graph using
// adjacency list representation
function Graph(vertices, adjList) {
    // initialise vertex count
    v = vertices;

    // initialise adjacency list
    initAdjList(v, adjList);
}

// utility method to initialise
// adjacency list
function initAdjList(v, adjList) {
    for (let i = 0; i < v; i++) {
        adjList[i] = [];
    }
}

// add edge from u to v
function addEdge(node, u, v, adjList, debugProp) {
    // Add v to u's list
    logMsg("addEdge u=" + node[u] + "," + node[v], debugProp);

    adjList[u].push(v);
}

// Prints all paths from
// 's' to 'd'
function printAllPaths(node, s1, d1, limit, adjList, r, debugProp) {

    let s = node.indexOf(s1);
    let d = node.indexOf(d1);

    let isVisited = new Array(v);
    for (let i = 0; i < v; i++)
        isVisited[i] = false;
    let pathList = [];

    // add source to path[]
    pathList.push(s);

    // Call recursive utility
    if (limit > 10) lmi = 10;
    printAllPathsUtil(s, d, limit, isVisited, pathList, adjList, r, debugProp);

    // logMsg("64 r="+JSON.stringify(r), lc,debug_ks);


}

// A recursive function to print
// all paths from 'u' to 'd'.
// isVisited[] keeps track of
// vertices in current path.
// localPathList<> stores actual
// vertices in the current path
function printAllPathsUtil(u, d, limit, isVisited, localPathList, adjList, r, debugProp) {

    if (limit == 0)
        return;
    if (u == d) {
        //console.log(localPathList);
        let clonedArray = JSON.parse(JSON.stringify(localPathList))

        r.push(clonedArray);

        // if match found then no need to
        // traverse more till depth
        return;
    }

    // Mark the current node
    isVisited[u] = true;

    // Recur for all the vertices
    // adjacent to current vertex

    for (let i = 0; i < adjList[u].length; i++) {
        //logMsg("85 papu isV[u][i] "+isVisited[adjList[u][i]], lc,debug_ks);
        if (!isVisited[adjList[u][i]]) {
            // store current node
            // in path[]

            localPathList.push(adjList[u][i]);

            printAllPathsUtil(adjList[u][i], d, limit - 1,
                isVisited, localPathList, adjList, r, debugProp);

            // remove current node
            // in path[]
            localPathList.splice(localPathList.indexOf
                (adjList[u][i]), 1);

        }
    }

    // Mark the current node
    isVisited[u] = false;
}

function formatResultxx(node, start_with, destNode, result, formattedResult, connectToFld, hierFld, pathFld, debugProp) {

    logMsg("125 result=" + JSON.stringify(result), debugProp);
    var obj = {
        [connectToFld]: start_with,
        [hierFld]: [],
        [hierFld + "_count"]: result.length

    };

    for (var i = 0; i < result.length; i++) {
        var dest1 = {
            [connectToFld]: destNode,
            ['stops']: result[i].length - 2,
            [pathFld]: []
        }
        for (var j = 0; j < result[i].length; j++) {
            dest1[pathFld].push(node[result[i][j]]);
        }
        obj[hierFld].push(dest1);
    }
    formattedResult.push(obj);
}
function formatResult(node, start_with, destNode, result, formattedResult, connectToFld, connectFromFld, hierFld, pathFld, debugProp) {

    logMsg("125 result=" + JSON.stringify(result), debugProp);


    for (var i = 0; i < result.length; i++) {
        var obj = {
            [connectToFld]: start_with,
            [hierFld]: [],
            [hierFld + "_count"]: result.length

        };
        var dest1 = {

            [connectToFld]: start_with,
            ['stops']: result[i].length - 2,
            [pathFld]: []
        }
        for (var j = 0; j < result[i].length; j++) {
            dest1[pathFld].push(node[result[i][j]]);
        }
        //obj[connectFromFld] = node[result[i][j]];
        obj[hierFld].push(dest1);
        formattedResult.push(obj);
    }

}

function elapsedTime(interval) {
    if (!interval.t) {
        interval.t = new Date();
        return 0;
    }
    else {
        let v = new Date();
        let r = v - interval.t;
        interval.t = v;
        return r;
    }
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

function traverseGraph(kSpace, startNode, destNode, maxStop, connectToFld, connectFromFld, hierFld, pathFld, debugKSpace) {

    let result = [];
    let q1 = "";
    var formattedResult = [];
    var debugProp = initLog(debugKSpace, arguments.callee.toString());
    let tm = { t: 0 }
    elapsedTime(tm);

    try {


        logMsg("176 Elapsed Time from start=" + elapsedTime(tm), debugProp);

        // expect flat list - connectFromFld should not be an array
        // read all edges
        query = "SELECT __a." + connectToFld + ",__a." + connectFromFld
            + " FROM " + kSpace + " __a "
            + " WHERE __a." + connectToFld + " IS NOT MISSING";
        var edge = [];
        logMsg("194 query=" + query, debugProp);
        q1 = N1QL(query);
        for (const doc of q1) {
            edge.push(doc);
        }
        q1.close();


        logMsg("204 Elapsed Time to query all edges=" + elapsedTime(tm), debugProp);
        logMsg("205 Edges length=" + edge.length, debugProp);


        // build up the node array of actual node values
        var node = [];
        for (var i = 0; i < edge.length; i++) {
            if (!node.includes(edge[i][connectToFld]))
                node.push(edge[i][connectToFld]);
            if (!node.includes(edge[i][connectFromFld]))
                node.push(edge[i][connectFromFld]);
        }
        logMsg("Elapsed Time to build node[]=" + elapsedTime(tm), debugProp);
        logMsg("213 node count =" + node.length, debugProp);



        var adjList = new Array(node.length);
        var g = new Graph(node.length, adjList);



        for (const doc of edge) {
            adjList[node.indexOf(doc[connectToFld])].push(node.indexOf(doc[connectFromFld]));
        }
        logMsg("Elapsed Time to setup graph " + elapsedTime(tm), debugProp);

        printAllPaths(node, startNode, destNode, maxStop + 2, adjList, result, debugProp);
        logMsg("Elapsed Time to find node " + elapsedTime(tm), debugProp);


        formatResult(node, startNode, destNode, result, formattedResult, connectToFld, connectFromFld, hierFld, pathFld, debugProp);
        return (formattedResult)s;
    }
    catch (e) {
        logMsg("Error =" + e, debugProp);
        return "Error...";
    }
   

}
