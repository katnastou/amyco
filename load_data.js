var mysql = require("mysql");

var connection = mysql.createConnection({
    host : "localhost",
    user : "katnastou",
    password: "katerina12345",
    database : "AMYCO_V1_1"
});
/*WARNING!!!*/
// used this only once to load data in the database --> have to use on every update
//load data infile does not work due to security issues --> USE LOAD DATA LOCAL INFILE

 var q1 = 'LOAD DATA LOCAL INFILE ? INTO TABLE DBLINKS';
 var pathToFile1 = "./dbdata/DBLINKS.tab";
 connection.query(q1, pathToFile1, function(error, result){
     if(error) throw error;
     console.log(result);
 });
 
 
 var q3 = 'LOAD DATA LOCAL INFILE ? INTO TABLE DISEASE';
 var pathToFile3 = "./dbdata/DISEASE.tab";
 connection.query(q3, pathToFile3, function(error, result){
     if(error) throw error;
     console.log(result);
 });
 
 var q4 = 'LOAD DATA LOCAL INFILE ? INTO TABLE PROTEIN';
 var pathToFile4 = "./dbdata/PROTEIN.tab";
 connection.query(q4, pathToFile4, function(error, result){
     if(error) throw error;
     console.log(result);
 });

 var q5 = 'LOAD DATA LOCAL INFILE ? INTO TABLE PROTEIN_TO_DISEASE';
 var pathToFile5 = "./dbdata/PROTEIN_TO_DISEASE.tab";
 connection.query(q5, pathToFile5, function(error, result){
     if(error) throw error;
     console.log(result);
 });

var q6 = 'LOAD DATA LOCAL INFILE ? INTO TABLE ALTERNATIVE_NAMES';
var pathToFile6 = "./dbdata/ALTERNATIVE_NAMES.tab";
connection.query(q6, pathToFile6, function(error, result){
    if(error) throw error;
    console.log(result);
});


var q8 = 'LOAD DATA LOCAL INFILE ? INTO TABLE CROSSREFERENCES';
var pathToFile8 = "./dbdata/CROSSREFERENCES.tab";
connection.query(q8, pathToFile8, function(error, result){
    if(error) throw error;
    console.log(result);
});


var q7 = 'LOAD DATA LOCAL INFILE ? INTO TABLE DISEASE_MAPPINGS';
var pathToFile7 = "./dbdata/DISEASE_MAPPINGS.tab";
connection.query(q7, pathToFile7, function(error, result){
    if(error) throw error;
    console.log(result);
});

connection.end();
