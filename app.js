var express = require("express");
var mysql = require("mysql");
var bodyParser  = require("body-parser");
var app = express();
var crypto = require("crypto");
var fs = require('fs');
var math = require('mathjs');
const { exec } = require('child_process');
var blast = require('blastjs');
var nodemailer = require("nodemailer");
var js2xmlparser = require("js2xmlparser");


//ON aws check on every restart
//mysql-ctl start
//export PATH=$PATH:$HOME/workspace/blast/bin
//echo $PATH


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());  //problem was with nodemon, maybe required???
app.use(express.static(__dirname + "/public"));

var connection = mysql.createConnection({
    host : "localhost",
    user : "", //fromfile
    database : "AMYCO_V1_1", 
    password: "", //fromfile
    multipleStatements: true
});

app.get("/", function(req, res){
        res.redirect("/amyco");
    });

app.get("/amyco", function(req, res){
    var q = "SELECT count(*) AS sel FROM DISEASE";
    connection.query(q, function(err, results){
        if(err) throw err;
        var sel = results[0].sel; 
        var q2 = "SELECT count(*) AS sel2 FROM PROTEIN ";
        connection.query(q2, function(err, results){
            if(err) throw err;
            var sel2 = results[0].sel2; 
            
                res.render("index", {sel: sel, sel2:sel2});
          
        });
    });
});



app.get("/amyco/blast", function(req, res){
    res.render("blast");
});

app.get("/amyco/privacy", function(req, res){
    res.render("privacy");
});

//NEXT CREATE BLAST DATABASE
//!!!Run once on every update of the database 
// var type = 'prot'; //prot
// var fileIn = './blast/amyco.fasta'; //upload new file for update
// var outPath = './blast';
// var name = 'amyco';
// blast.makeDB(type, fileIn, outPath, name, function(err){
//   if(err){
//     console.error(err);   
//   } else {
//     console.log('database created at', outPath);
//   }
// });

app.post("/amyco/blast", function(req, res){
    var id = crypto.randomBytes(16).toString("hex");
    var textareaData = req.body.fasta;

    var path = "blastresults/"+id+".fasta";
    var dbPath = "./blast/amyco";   //<---Upload that!!!! //change that to amyco sequences
    //!!!!!
    var query = textareaData;

    var outputBlast = "";
    fs.open(path, 'w', function(err, fd) { //write file with data from textarea
        if (err) throw 'error opening file: ' + err;
        fs.writeFile(fd, textareaData, function(err) {
            if(err) console.log(err);
            exec("grep -c '^>' "+path, (error, stdout, stderr) => { //count how many fasta are in the input
              if (error) {
                //console.error(`exec error: ${error}`);
                var errormsg= "You did not submit any FASTA sequences. Please resubmit with sequences in fasta format.";
                res.render("errorblast", {errormsg:errormsg});
              }
              var count = `${stdout}`; 
              if(math.floor(count) > 0 && math.floor(count) < 10){
                  blast.blastP(dbPath, query, function (err, output) {
                  if(!err){
                    outputBlast = output;
                    res.render("blastres",{outputBlast:outputBlast});
                   }
                });
  
              }
              else {
                errormsg= "You submitted more than 10 sequences. For large scale queries please contact us.";
                res.render("errorblast", {errormsg:errormsg});
              }
            });
            fs.close(fd, function() {
                console.log('file written');
            });
        });
    });
        
});


app.get("/amyco/manual", function(req, res){
         res.render("manual");
        //res.render("manual");
});

app.get("/amyco/contact", function(req, res){
    res.render("contact", {msg:"Send an email regarding the annotation of data in the database"});
});

app.post("/amyco/send", function(req,res){
    //console.log(req.body);
    var output =`
    <p>You have a new Contact request</p>
    <h3>Contact Details</h3>
    <ul>
        <li>Name: ${req.body.name}</li>
        <li>Email: ${req.body.email}</li>
    </ul>
    <h3>Message</h3>
    <p>${req.body.message}</p>
    `;
    
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        //https://community.nodemailer.com/using-gmail/
        //Enable less secure apps - https://www.google.com/settings/security/lesssecureapps
        //Disable Captcha temporarily so you can connect the new device/server - https://accounts.google.com/b/0/displayunlockcaptcha
        service: 'gmail',
        auth: {
            user: '', // read from file or add manually
            pass: ''  // read from file or add manually
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Nodemailer Contact" <>', // sender address --> same as user in transporter
        to: '', // list of receivers  --> email address to receie messages add manually
        subject: 'AmyCo request', // Subject line
        text: 'Hello world?', // plain text body
        html: output // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
    res.render('contact',{msg:"Email has been sent"});
});

app.get("/amyco/download", function(req, res){
    //res.attachment('permemdb.fasta'); 
    res.render("download");
});



app.get("/amyco/browse", function(req, res){
    var q ="SELECT DISEASE.DISEASE_ID AS dis_id, DISEASE.DISEASE_NAME AS dis_name, "+
            "DISEASE.DISEASE_TYPE AS dis_type, DISEASE.DISEASE_ASSOCIATION AS dis_assoc, DISEASE.DISEASE_TISSUE AS dis_tissue "+
            "FROM DISEASE ";
  
    connection.query(q, function(err, results){
        if(err) throw err;
        //console.log(results);
         res.render("browse", {results:results});
    });
});

app.post("/amyco/browse", function(req, res){
    var q1 = req.body.selectpicker1;
    var q2 = req.body.selectpicker2;
    var q3 = req.body.selectpicker3;
    //console.log(q1);
    //console.log(q2);
    //console.log(q3);
    //console.log(q1+" "+q2+" "+q3+" "+q4+" "+q5+" "+q6+" "+q7+" "+q10);

    if(q2 != undefined){
        var q4 ="SELECT DISEASE.DISEASE_ID AS dis_id, DISEASE.DISEASE_NAME AS dis_name, "+
            "DISEASE.DISEASE_TYPE AS dis_type, DISEASE.DISEASE_ASSOCIATION AS dis_assoc, DISEASE.DISEASE_TISSUE AS dis_tissue "+
            "FROM DISEASE "+
            "WHERE DISEASE.DISEASE_TYPE='Amyloidosis' AND DISEASE.DISEASE_ASSOCIATION = ? ";
   
        connection.query(q4, q2, function(err,  results){
            if(err) throw err;
            res.render("results", {results:results});
        }); 
    }
    if(q3 != undefined){
        var q5 ="SELECT DISEASE.DISEASE_ID AS dis_id, DISEASE.DISEASE_NAME AS dis_name, "+
            "DISEASE.DISEASE_TYPE AS dis_type, DISEASE.DISEASE_ASSOCIATION AS dis_assoc, DISEASE.DISEASE_TISSUE AS dis_tissue "+
            "FROM DISEASE "+
            "WHERE DISEASE.DISEASE_TYPE='Clinical conditions associated with amyloidosis' AND DISEASE.DISEASE_ASSOCIATION = ? ";
   
        connection.query(q5, q3, function(err,  results){
            if(err) throw err;
            res.render("results", {results:results});
        }); 
    }
    if(q1 != undefined){
        var q ="SELECT DISEASE.DISEASE_ID AS dis_id, DISEASE.DISEASE_NAME AS dis_name, "+
            "DISEASE.DISEASE_TYPE AS dis_type, DISEASE.DISEASE_ASSOCIATION AS dis_assoc, DISEASE.DISEASE_TISSUE AS dis_tissue "+
            "FROM DISEASE "+
            "WHERE DISEASE.DISEASE_TYPE = ? ";
   
        connection.query(q, q1, function(err,  results){
            if(err) throw err;
            res.render("results", {results:results});
        }); 
    }
});


app.get("/amyco/search", function(req, res){
    res.render("search");
});

app.post("/amyco/search", function(req, res){
    var q1 = req.body.disease;
    var q2 = req.body.protein;
    var q5a = Boolean(req.body.amyloidosis);
    var q5c = Boolean(req.body.occurence);
    var q6 = req.body.gene;
    var q7 = req.body.ac;
    var q10 = req.body.combine;
    //console.log(q10);
    //console.log(q1+" "+q2+" "+q3+" "+q4+" "+q5+" "+q6+" "+q7+" "+q10);
    if(q1!="" || q2!="" || q5a==true || q5c==true || q6!=""  || q7!="" ){
        var q = "SELECT DISTINCT DISEASE.DISEASE_ID AS dis_id, DISEASE.DISEASE_NAME AS dis_name, "+
        "DISEASE.DISEASE_TYPE AS dis_type, DISEASE.DISEASE_ASSOCIATION AS dis_assoc, DISEASE.DISEASE_TISSUE AS dis_tissue, "+
        "GROUP_CONCAT(DISTINCT PROTEIN.PRIMARY_NAME SEPARATOR '; ') AS prnames "+
        "FROM DISEASE "+
        "LEFT JOIN PROTEIN_TO_DISEASE ON DISEASE.DISEASE_ID=PROTEIN_TO_DISEASE.DIS_ID "+
        "LEFT JOIN PROTEIN ON PROTEIN_TO_DISEASE.PR_ID=PROTEIN.PROTEIN_ID "+
        "LEFT JOIN ALTERNATIVE_NAMES ON  DISEASE.DISEASE_ID=ALTERNATIVE_NAMES.DIS_ID "+
        "WHERE ";	
        var stror= " OR ";
        var strand = " AND ";
        if(q1!=""){
            q1 = q1.replace(/'/g, "''");
            //console.log(q1);
			//DISEASE_ISA_NAME
            var str1="((ALTERNATIVE_NAMES.ALTERNATIVE_NAME LIKE '%"+ q1 +"%') OR (DISEASE.DISEASE_NAME LIKE '%"+ q1 +"%')OR (DISEASE.DISEASE_ISA_NAME LIKE '%"+ q1 +"%')) ";
            q=q.concat(str1);
            if(q2!="" || q5a==true ||  q5c==true || q6!=""  || q7!="" ){
                if (q10=="or") {q=q.concat(stror);}
                if (q10=="and") {q=q.concat(strand);}
            }
        }
        if(q2!=""){
            q2 = q2.replace(/'/g, "''");
            var str2="((PROTEIN.PROTEIN_NAMES LIKE '%"+ q2 +"%') OR (PROTEIN.SIPE_NAME LIKE '%"+ q2 +"%'))";
            q=q.concat(str2);
            if( q5a==true || q5c==true || q6!=""  || q7!="" ){
                if (q10=="or") {q=q.concat(stror);}
                if (q10=="and") {q=q.concat(strand);}
            }
        }
        if(q5a==true){
            var str5a="DISEASE.DISEASE_TYPE = 'Amyloidosis' ";
            q=q.concat(str5a);
            if(q5c==true || q6!=""  || q7!="" ){
                if (q10=="or") {q=q.concat(stror);}
                if (q10=="and") {q=q.concat(strand);}
            }
        }
        if(q5c==true){
            var str5c="DISEASE.DISEASE_TYPE = 'Clinical conditions associated with amyloidosis' ";
            q=q.concat(str5c);
            if(q6!=""  || q7!="" ){
                if (q10=="or") {q=q.concat(stror);}
                if (q10=="and") {q=q.concat(strand);}
            }
        }
        if(q6!=""){
            q6 = q6.replace(/'/g, "''");
            var str6="PROTEIN.GENENAME LIKE '%"+ q6 +"%' ";
            q=q.concat(str6);
            if(q7!=""  ){
                if (q10=="or") {q=q.concat(stror);}
                if (q10=="and") {q=q.concat(strand);}
            }
        }
        if(q7!=""){
            q7 = q7.replace(/'/g, "''");
            var str7="((PROTEIN.AC LIKE '%"+ q7 +"%') OR (PROTEIN.UNIPROT_ID LIKE '%"+ q7 +"%')) ";
            q=q.concat(str7);
        }
        q=q.concat("GROUP BY DISEASE.DISEASE_NAME;");
    
        connection.query(q, function(err,  results){
            if(err) throw err;
            //console.log(results);
            //res.render("browse", {results:results});
            if(results=="") {
                var errormsg= "No results match your query. Please try again!";
                res.render("alert", {errormsg:errormsg});
            } else {
                res.render("searchresults", {results:results});
            }
        }); 
    }
    else{
        var errormsg= "You did not fill any of the requested fields. Please try again!";
        res.render("error", {errormsg:errormsg});
    } 
    //res.redirect("results");
});

app.get("/amyco/results", function(req, res){
    //res.render("this is the results page");
    res.render("results");
    //res.render("browse", {results:results});
});


app.get("/amyco/:id", function(req,res){
    
      var q1 =  "SELECT DISTINCT DISEASE.DISEASE_ID AS dis_id, DISEASE.DISEASE_NAME AS dis_name, DISEASE.DISEASE_DESCRIPTION dis_descr, "+
                "DISEASE.DISEASE_TYPE AS dis_type, DISEASE.DISEASE_ASSOCIATION AS dis_assoc, DISEASE.DISEASE_TISSUE AS dis_tissue, DISEASE.DISEASE_ISA_NAME AS isa_name "+
                "FROM DISEASE "+
                "LEFT JOIN PROTEIN_TO_DISEASE ON DISEASE.DISEASE_ID=PROTEIN_TO_DISEASE.DIS_ID "+
                "LEFT JOIN PROTEIN ON PROTEIN_TO_DISEASE.PR_ID=PROTEIN.PROTEIN_ID "+
                "WHERE DISEASE.DISEASE_ID = ? ";
            var dis_id = "";
            var dis_name = "";
            var dis_descr = "";
            var dis_type = "";
            var dis_assoc = "";
            var dis_tissue = "";
            var isa_name = "";
            
            var crossref_id = [];
            var weblink = [];
            var abbreviation = [];
            
            var alt_names = [];
            
            var targets = [];
            var sources = [];
            var intTypes = [];
            var node_ids = [];
            
            var primary_names=[];
            var genenames =[];
            var lengths =[];
            var seqs=[];
            var protein_names =[];
            var acs = [];
            var uniprot_ids =[];
            var amypro_ids= [];
            var sipe_names = [];
            
            var colprimary_names =[];
            var colgenenames =[];
            var collengths =[];
            var colseqs=[];
            var colprotein_names =[];
            var colacs = [];
            var coluniprot_ids =[];
            var assoc_source =[];
			
            var mappings_amyloid =[];
            var dis_map_name=[];

            //console.log(q1);
            //console.log(req.params.id);
         connection.query(q1, req.params.id, function(err, results, fields){
            if(err) throw err;
            dis_id = results[0].dis_id;
            dis_name = results[0].dis_name;
            dis_descr = results[0].dis_descr;
            dis_type = results[0].dis_type;
            dis_assoc = results[0].dis_assoc;
            dis_tissue = results[0].dis_tissue;
            isa_name = results[0].isa_name;
            
            var q2= "SELECT CROSSREFERENCES.CROSSREF_ID AS crossref_id, DBLINKS.WEBLINK AS weblink, DBLINKS.ABBREVIATION AS abbreviation "+
                    "FROM DISEASE "+
                    "LEFT JOIN CROSSREFERENCES ON  DISEASE.DISEASE_ID=CROSSREFERENCES.DIS_ID "+
                    "LEFT JOIN DBLINKS ON  DBLINKS.DATAB_ID=CROSSREFERENCES.DATAB_ID "+
                    "WHERE DISEASE.DISEASE_ID = ? ";
                //console.log(q2);
            // var q2 =    "SELECT DISTINCT ALTERNATIVE_NAMES.ALTERNATIVE_NAME "+
            //             "FROM DISEASE "+
            //             "LEFT JOIN ALTERNATIVE_NAMES ON  DISEASE.DISEASE_ID=ALTERNATIVE_NAMES.DIS_ID "+
            //             "WHERE DISEASE.DISEASE_ID =?";
            //Code for sif file read           
            var nodes = {}, links = {};
            var _getNode = function(id){
                if(!nodes[id]) nodes[id] = {id:id};
                return nodes[id];
            };
            
            var _parse = function(line, i){
                line = (line.split('\t').length > 1) ? line.split('\t') : line.split(' ');
                if(line.length < 3){
                    console.warn('SIFJS cannot parse line ' + i + ' "' + line + '"');
                    return;
                }
                
            var source = _getNode(line[0]), intType = line[1], j, length;
                for (j = 2, length = line.length; j < length; j++) {
                    var target = _getNode(line[j]);
                    if(source < target){
                        links[source.id + target.id + intType] = {target: target.id, source: source.id, intType: intType};
                    } else {
                        links[target.id + source.id + intType] = {target: target.id, source: source.id, intType: intType};
                    }
                }        
            };
            
            var _toArr = function(obj){
                var arr = [];
                for (var key in obj) arr.push(obj[key]);
                return arr;
            };  
            
            function SIFJS() {};
                                
            SIFJS.parse = function(data){
                
                var lines = data.split('\n'), i, length;
                for (i = 0, length = lines.length; i < length; i++) _parse(lines[i], i);
                
                return {nodes:_toArr(nodes), links:_toArr(links)};
            };  
                        
            var input = dis_id; //create a file for each disease
            var data = "";
            var path2 = './public/sif_files/'+input+'.sif';
            if (fs.existsSync(path2)) {
                //console.log ("a sif file is here");
                data = fs.readFileSync(path2, 'utf8');
                var interactions = {};
                interactions = SIFJS.parse(data);
                var nodes2 = interactions.nodes;
                var edges = interactions.links;
            } else{
                //console.log ("no sif file for you");
                nodes2 = [];
                edges = [];
            }
            //End of Code for sif file read  
                connection.query(q2, req.params.id, function(err, results, fields){
                    if(err) throw err;
                    for(var i in results){
                        crossref_id[i]=results[i].crossref_id;
                        weblink[i]=results[i].weblink;
                        abbreviation[i]=results[i].abbreviation;
                    }
                    if (fs.existsSync(path2)) {
                        for(var k=0; k<nodes2.length; k++){
                            node_ids.push(nodes2[k].id);
                            //console.log(node_ids); 
                        }
                        targets = [];
                        sources = [];
                        intTypes = [];
                        for(var j=0; j<edges.length; j++){
                            targets.push(edges[j].target);
                            sources.push(edges[j].source);
                            intTypes.push(edges[j].intType);
                        }
                        //edges=[];
                           // console.log(acs+" "+datab_id +" " +weblink+" "+abbreviation);
                           //console.log(weblink.length);
                        //res.render("show", {weblink: weblink});
                    }
                    else{
                        node_ids =[];
                        //console.log(node_ids); 
                        targets =[];
                        sources =[];
                        intTypes =[];
                    }
                    
                    var q3 =    "SELECT DISTINCT ALTERNATIVE_NAMES.ALTERNATIVE_NAME AS alt_names "+
                                "FROM DISEASE "+
                                "LEFT JOIN ALTERNATIVE_NAMES ON  DISEASE.DISEASE_ID=ALTERNATIVE_NAMES.DIS_ID "+
                                "WHERE DISEASE.DISEASE_ID = ? ";
                             connection.query(q3, req.params.id, function(err, results2){
                                if(err) throw err;
                                    for(var i in results2){
                                        alt_names[i]=results2[i].alt_names;
                                    }
                                    var q5 =    "SELECT  PROTEIN.GENENAME AS genename, PROTEIN.SEQ_LENGTH AS seqlength, PROTEIN.SEQUENCE AS seq, PROTEIN.PROTEIN_NAMES AS protein_name, "+ 
                                                "PROTEIN.AC AS ac, PROTEIN.PRIMARY_NAME AS primary_name, PROTEIN.UNIPROT_ID AS uniprot_id, PROTEIN.SIPE_NAME AS sipe_name, "+
                                                "PROTEIN_TO_DISEASE.AMYPRO_ID AS amypro_id "+
                                                "FROM DISEASE "+
                                                "LEFT JOIN PROTEIN_TO_DISEASE ON PROTEIN_TO_DISEASE.DIS_ID=DISEASE.DISEASE_ID "+
                                                "LEFT JOIN PROTEIN ON PROTEIN_TO_DISEASE.PR_ID=PROTEIN.PROTEIN_ID "+
                                                "WHERE PROTEIN_TO_DISEASE.RELATIONSHIP='Major Component' AND DISEASE.DISEASE_ID = ?"; 
                                             connection.query(q5, req.params.id, function(err, results5){
                                                if(err) throw err;
                                                    for(var i in results5){
                                                        genenames[i]=results5[i].genename;
                                                        primary_names[i]=results5[i].primary_name;
                                                        lengths[i]=results5[i].seqlength;
                                                        seqs[i]=results5[i].seq;
                                                        protein_names[i]=results5[i].protein_name;
                                                        acs[i]=results5[i].ac;
                                                        uniprot_ids[i]=results5[i].uniprot_id;
                                                        sipe_names[i]=results5[i].sipe_name;
                                                        amypro_ids[i]=results5[i].amypro_id;
                                                    }
                                                    var q6 =    "SELECT  PROTEIN.GENENAME AS colgenename, PROTEIN.SEQ_LENGTH AS colseqlength, PROTEIN.SEQUENCE AS colseq, PROTEIN.PROTEIN_NAMES AS colprotein_name, "+
                                                                "PROTEIN.AC AS colac, PROTEIN.PRIMARY_NAME AS colprimary_name, PROTEIN.UNIPROT_ID AS coluniprot_id, PROTEIN_TO_DISEASE.PUBMED_ID AS assoc_sourc "+
                                                                "FROM DISEASE "+
                                                                "LEFT JOIN PROTEIN_TO_DISEASE ON PROTEIN_TO_DISEASE.DIS_ID=DISEASE.DISEASE_ID "+
                                                                "LEFT JOIN PROTEIN ON PROTEIN_TO_DISEASE.PR_ID=PROTEIN.PROTEIN_ID "+
                                                                "WHERE PROTEIN_TO_DISEASE.RELATIONSHIP='Other Component' AND DISEASE.DISEASE_ID = ?"; //PROTEIN_TO_DISEASE.RELATIONSHIP='AMYLOIDOGENIC' AND 
                                                             connection.query(q6, req.params.id, function(err, results6){
                                                                if(err) throw err;
                                                                    for(var i in results6){
                                                                        colgenenames[i]=results6[i].colgenename;
                                                                        colprimary_names[i]=results6[i].colprimary_name;
                                                                        collengths[i]=results6[i].colseqlength;
                                                                        colseqs[i]=results6[i].colseq;
                                                                        colprotein_names[i]=results6[i].colprotein_name;
                                                                        colacs[i]=results6[i].colac;
                                                                        coluniprot_ids[i]=results6[i].coluniprot_id;
                                                                        assoc_source[i]=results6[i].assoc_sourc;
                                                                    }
                                                                //console.log(colacs);
																//insert protein_info && mesh description!!!
																//console.log(confidence);
																//console.log(amypro_ids);
															var q7 =    "SELECT DISEASE_MAPPINGS.DIS_TO_ID AS mappings_amyloid, DISEASE.DISEASE_NAME AS dis_map_name "+
                                                                "FROM DISEASE_MAPPINGS "+
                                                                "LEFT JOIN DISEASE ON DISEASE_MAPPINGS.DIS_TO_ID=DISEASE.DISEASE_ID "+
                                                                "WHERE DISEASE_MAPPINGS.DIS_FROM_ID = ?"; //PROTEIN_TO_DISEASE.RELATIONSHIP='AMYLOIDOGENIC' AND 
                                                             connection.query(q7, req.params.id, function(err, results7){
                                                                if(err) throw err;
                                                                    for(var i in results7){
                                                                        mappings_amyloid[i]=results7[i].mappings_amyloid;
                                                                        dis_map_name[i]=results7[i].dis_map_name;
                                                                    }
																		res.render("show", {//protein variables from q1
																							dis_id: dis_id, 
																							dis_name:dis_name,
																							dis_descr:dis_descr,
																							dis_type:dis_type,
																							dis_assoc:dis_assoc,
																							dis_tissue:dis_tissue,
																							isa_name:isa_name,
																							alt_names:alt_names,
																							uniprot_ids:uniprot_ids,
																							primary_names:primary_names,
																							genenames:genenames,
																							lengths:lengths,
																							seqs:seqs,
																							protein_names:protein_names,
																							acs:acs,
																							amypro_ids:amypro_ids,
																							sipe_names:sipe_names,
																							
																							coluniprot_ids:coluniprot_ids,
																							colprimary_names:colprimary_names,
																							colgenenames:colgenenames,
																							collengths:collengths,
																							colseqs:colseqs,
																							colprotein_names:colprotein_names,
																							colacs:colacs,
																							assoc_source:assoc_source,
																							
																							//sources variables from q2
																							weblink: weblink,
																							abbreviation:abbreviation,
																							crossref_id:crossref_id,
																							
																							//network variables from sif files
																							node_ids:node_ids, 
																							targets:targets, 
																							sources:sources, 
																							intTypes:intTypes,
																							
																							//crosslink to amyco
																							mappings_amyloid:mappings_amyloid,
																							dis_map_name:dis_map_name
																						});
																});
                                             });
                                                
                                    });
                            });
                            
                });
            });
        
    });

//app.listen(process.env.PORT, process.env.IP, function(){
 //   console.log("Server has Started");
//});

//connection.end();

 app.listen(8084, function(){
     console.log("Server running on 8084!");
 });
