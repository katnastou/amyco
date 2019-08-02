var mysql = require("mysql");
var js2xmlparser =require ("js2xmlparser");
var fs = require('fs');
//var system = require('system');
//var args = system.args;
    var connection = mysql.createConnection({
        host : "localhost",
        user : "", //fromfile
        database : "AMYCO_V1_1",
        password: "" //fromfile
    });

function create_files(start){
    var suffixes =[];
    var end=Number(75); //--> for the last one
     for(var j=start;j<=end;j++){
         suffixes.push(j);
     }   

suffixes.forEach(function(id) {
    //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
    //!!Create a javascript object 
     var obj = {
         name: String,
         descriptions: String,
     	type: String,
     	association: String,
     	tissue: String,
     	proteins: [],
     	alternative_names: [],
     	crossreferences:[],
     	mappings_amyloid:[]
     };
     var textfile = "";
    var siffile ="";
    //!!--End of Code Snippet--!!//
    
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
            //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
             obj.name = dis_name;
             obj.descriptions = dis_descr;
             obj.type = dis_type;
             obj.association = dis_assoc;
             obj.tissue = dis_tissue;
             obj.isa_name = isa_name;
             textfile = textfile.concat("ID: "+dis_id+"\r\n\r\n"+"Disease Name: "+dis_name+"\r\n\r\n"+"Description: "+ dis_descr+"\r\n\r\n"+"Disease Type: "+dis_type+"\r\n\r\n");
             if(isa_name!=""){
				textfile = textfile.concat("ISA Name: "+ isa_name+"\r\n\r\n");
			 }
             textfile = textfile.concat("ICD-10 Classification: "+dis_assoc+"\r\n\r\n"+"Tissue: "+ dis_tissue+"\r\n\r\nCross References\r\n");
            
            //!!--End of Code Snippet--!!//
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
                        //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
                         obj.crossreferences.push({
                                             		abbreviation: abbreviation[i],
                                             		link:  weblink[i]+crossref_id[i],
                                          	
                                             	});
                         textfile = textfile.concat(weblink[i]+crossref_id[i]+"\r\n\r\n"); //abbreviation[i]+ ": "+

                        //!!--End of Code Snippet--!!//
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
                                 textfile = textfile.concat("Alternative Names:\r\n"); //!!--Run Code Snippet
                                    for(var i in results2){
                                        alt_names[i]=results2[i].alt_names;
                                        //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
                                         obj.alternative_names.push(alt_names[i]);
                                         textfile = textfile.concat(alt_names[i]+"\r\n");

                                        //!!--End of Code Snippet--!!//
                                    }
                                     textfile = textfile.concat("\r\n"); //!!--Run Code Snippet
                                    var q5 =    "SELECT  PROTEIN.GENENAME AS genename, PROTEIN.SEQ_LENGTH AS seqlength, PROTEIN.SEQUENCE AS seq, PROTEIN.PROTEIN_NAMES AS protein_name, "+ 
                                                "PROTEIN.AC AS ac, PROTEIN.PRIMARY_NAME AS primary_name, PROTEIN.UNIPROT_ID AS uniprot_id, PROTEIN.SIPE_NAME AS sipe_name, "+
                                                "PROTEIN_TO_DISEASE.AMYPRO_ID AS amypro_id "+
                                                "FROM DISEASE "+
                                                "LEFT JOIN PROTEIN_TO_DISEASE ON PROTEIN_TO_DISEASE.DIS_ID=DISEASE.DISEASE_ID "+
                                                "LEFT JOIN PROTEIN ON PROTEIN_TO_DISEASE.PR_ID=PROTEIN.PROTEIN_ID "+
                                                "WHERE PROTEIN_TO_DISEASE.RELATIONSHIP='Major Component' AND DISEASE.DISEASE_ID = ?"; 
                                             connection.query(q5, req.params.id, function(err, results5){
                                                if(err) throw err;
                                                 textfile = textfile.concat("Precursor Protein:\r\n"); //!!--Run Code Snippet
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
                                                        //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
                                                         if(genenames[i]!=""){
                                                             obj.proteins.push({
                                                                                 name: results5[i].primary_name,
                                                                         		ac: results5[i].ac,
                                                                         		id: results5[i].uniprot_id,
                                                                         		seq: results5[i].seq,
                                                                         		length: results5[i].seqlength,
                                                                         		genename: results5[i].genename,
                                                                         		type: "Precursor Protein"
                                                                         });
                                                             textfile = textfile.concat(acs[i]+" | "+ primary_names[i] +"\r\n");
                                                                 siffile = siffile.concat(dis_name+"\tmc\t"+acs[i]+"\n");
                                                         }
                                                        //!!--End of Code Snippet--!!// 
                                                        
                                                    }
                                                     textfile = textfile.concat("\r\n\r\n"); //!!--Run Code Snippet
                                                    var q6 =    "SELECT  PROTEIN.GENENAME AS colgenename, PROTEIN.SEQ_LENGTH AS colseqlength, PROTEIN.SEQUENCE AS colseq, PROTEIN.PROTEIN_NAMES AS colprotein_name, "+
                                                                "PROTEIN.AC AS colac, PROTEIN.PRIMARY_NAME AS colprimary_name, PROTEIN.UNIPROT_ID AS coluniprot_id, PROTEIN_TO_DISEASE.PUBMED_ID AS assoc_sourc "+
                                                                "FROM DISEASE "+
                                                                "LEFT JOIN PROTEIN_TO_DISEASE ON PROTEIN_TO_DISEASE.DIS_ID=DISEASE.DISEASE_ID "+
                                                                "LEFT JOIN PROTEIN ON PROTEIN_TO_DISEASE.PR_ID=PROTEIN.PROTEIN_ID "+
                                                                "WHERE PROTEIN_TO_DISEASE.RELATIONSHIP='Other Component' AND DISEASE.DISEASE_ID = ?"; //PROTEIN_TO_DISEASE.RELATIONSHIP='AMYLOIDOGENIC' AND 
                                                             connection.query(q6, req.params.id, function(err, results6){
                                                                if(err) throw err;
                                                                 textfile = textfile.concat("Co-deposited Proteins: \r\n"); //!!--Run Code Snippet
                                                                    for(var i in results6){
                                                                        colgenenames[i]=results6[i].colgenename;
                                                                        colprimary_names[i]=results6[i].colprimary_name;
                                                                        collengths[i]=results6[i].colseqlength;
                                                                        colseqs[i]=results6[i].colseq;
                                                                        colprotein_names[i]=results6[i].colprotein_name;
                                                                        colacs[i]=results6[i].colac;
                                                                        coluniprot_ids[i]=results6[i].coluniprot_id;
                                                                        assoc_source[i]=results6[i].assoc_sourc;
                                                                        //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
                                                                         if(colgenenames[i]!=""){
                                                                             obj.proteins.push({
                                                                                 name: results6[i].colprimary_name,
                                                                                 id: results6[i].coluniprot_id,
                                                                         		ac: results6[i].colac,
                                                                         		seq: results6[i].colseq,
                                                                         		length: results6[i].colseqlength,
                                                                         		genename: results6[i].colgenename,
                                                                         		type: "Co-deposited Protein",
                                                                         		association_source:results6[i].assoc_sourc 
                                                                                 });
                                                                             textfile = textfile.concat(colacs[i]+" | "+ colprimary_names[i] +"\r\n");
                                                                             siffile = siffile.concat(dis_name+"\toc\t"+colacs[i]+"\n");
                                                                         } 
                                                                        
                                                                        //!!--End of Code Snippet--!!// 
                                                                    }
                                                                    //!!--Run Code Snippet--!!//
                                                                     if (results6 == ""){
                                                                         textfile =textfile.concat("No information available\r\n\r\n");
                                                                     }
                                                                     
                                                                    //!!--End of Code Snippet--!!// 
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
																
                                                                 textfile = textfile.concat("\r\n\r\nLink to Amyloidosis: \r\n"); //!!--Run Code Snippet
																
                                                                    for(var i in results7){
                                                                        mappings_amyloid[i]=results7[i].mappings_amyloid;
                                                                        dis_map_name[i]=results7[i].dis_map_name;
                                                                        //!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
                                                                         if(mappings_amyloid[i]!=""){
                                                                             obj.mappings_amyloid.push("http://83.212.109.111:8084/amyco/"+mappings_amyloid[i]);
																			textfile = textfile.concat("\thttp://83.212.109.111:8084/amyco/"+mappings_amyloid[i]+"\r\n");

7                                                                         } 
                                                                        
                                                                        //!!--End of Code Snippet--!!// 
                                                                    }
                                                                    //!!--Run Code Snippet--!!//
                                                                     if (results7 == ""){
                                                                         textfile =textfile.concat("\tNo information available");
                                                                     }
                                                                     textfile = textfile.concat("\r\n//\r\n");
                                                                    //!!--End of Code Snippet--!!// 
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
																				//!!--Run Code Snippet once to create database files for all entries, then conatenate and comment out--!!//
																				//!!Convert it from an object to string with stringify
																				 var json = JSON.stringify(obj,null,4);
																				
																				//!! use fs to write the file to disk
																				 fs.writeFile(dis_id+'.json', json, 'utf8', function(err2){
																						 if(err2) throw err2;
																					 });
																					 //create file with all entries
																					 //!!to create the amyco.json cat *.json > amyco.json && replace  }{ with },\n{
																				 //!!and add [ at the start of file and ] at EOF
																					//for a in *.json ; do cat $a>>amyco.json ; done
																					//sed -i $'s/}{/},\\\n{/g' amyco.json
																					//ex -sc '1i|[' -cx amyco.json //add before first line
																					//sed -i amyco.json -e  "\$a]" //add after last line
																					
																				 fs.writeFile(dis_id+'.sif', siffile, 'utf8', function(err2){
																						  if(err2) throw err2;
																					  });
																				//!!to create the amyco.txt with files in correct order
																				//!! cat $(find ./ -name "*.txt" | sort -V) > amyco.txt 
																				 fs.writeFile(dis_id+'.txt', textfile, 'utf8', function(err2){
																						 if(err2) throw err2;
																					 }); 
																				 
																				 var xml = js2xmlparser.parse("disease", obj);
																				
																				 fs.writeFile(dis_id+'.xml', xml, 'utf8', function(err2){
																						 if(err2) throw err2;
																				 }); 
																				//!!to create the amyco.xml cat *.xml > amyco.xml && replace  <?xml version='1.0'?> with ''
																				//!!and add <root> at start and  </root> end of file
																				//for a in *.xml ; do cat $a>>amyco.xml2 ; done
																				//sed -i -r 's/<(\?xml version.+?)>//' amyco.xml     //removes all xml version lines
																			   //sed -i '1d' amyco.xml //removes first line
																			   //ex -sc '1i|<root>' -cx amyco.xml //add before first line
																			   //sed -i amyco.xml -e  "\$a</root>" //add after last line
																				//!!--End of Code Snippet--!!//  
																});
                                             });
                                                
                                    });
                            });
                            
                });
            });
        
    });
}
create_files(Number(1));
//End connection manually