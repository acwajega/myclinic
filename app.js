   


   var http = require('http');
   
   //this is going to parse the URL from the mobile Client
   var url = require('url');
   //-----Mysql
   var mysql      = require('mysql');
   var connection = mysql.createConnection({
     host     : 'localhost',
     user     : 'admin',
     password : 'matilda123',
     database : 'mcm_master_db'
   });
   
   
   //--------Connecting to mysql
   connection.connect(function(err){
   if(!err) {
       console.log("Database is connected ... nn");    
   } else {
       console.log(err);    
   }
   });
   //-----------------------------------------------------------
   
   
   
   
   


   
   //-------------------------------------Creating the Server Componet........................................
   http.createServer(function (req, res){
   
   //--------------------------New Server Client Request-----------------------------------------------------
   console.log('Recieved Request'+ req.url);
   
   //-------inSERTING INTO THE DATABASE
   var ip = req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
   
        var d = new Date(); 
        var mdate = d.getFullYear() +'-'+(d.getMonth()+1)+'-'+d.getDate() ;
   
        var time = new Date();
        var m_time = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
   
        connection.query('insert into server_requests set ?', {SR_DATE: mdate,SR_TIME: m_time,SR_IP:ip,SR_REQ:req.url}, function(err, result) {
     if (err) throw err;
    
     console.log(result.insertId);
   });
   //--------------------------------End of New Request-------------------------------
   
   //------Specifying the type of request
   res.writeHead(200, {'Content-Type': 'application/json'});
   
   //------------------------------Parsing the recieved URL----------
   var querryData = url.parse(req.url, true).query;
   
   
   //---Checking the for the action
   
   //-1....When action is authentication
   if (querryData.action ==='auth'){
   
   //----Query mysql for the username and password to see if they are correct
   connection.query('select * from users_info where ui_username = ? and ui_password =?',[querryData.uname,querryData.pword], function (err, results){
   
   if (err){
   
   throw(err);
   
   }
   else
   {
   	//---USer Not Found
   if (results.length ===0){
   
    res.end(JSON.stringify({resp:"err"}));
    console.log('Access Denied..Invalid Username or Password');
   
   }
   //user fiund 
   else
   {
   //-------Generating an access token ------------------------------------------------
   var hat = require('hat');
   var token_id = hat();
   //--------------------------End of token Generation --------------------------------
   var user = results[0];
   var obj = JSON.parse(JSON.stringify(user));
   res.end(JSON.stringify({resp:"pass",clinic_id:obj.UI_MCI_ID,access_token:token_id}));
   
   console.log(JSON.stringify(user));
   console.log(obj.UI_USERNAME);
   console.log('Access Granted!!...');
   
   var d = new Date(); 
        var Adate = d.getFullYear() +'-'+(d.getMonth()+1)+'-'+d.getDate() ;
   
        var Atime = new Date();
        var m_time = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
   
   
   //-----------------------------RECORDING A USER LOG INTO THE SYSTEM -------------------------------------------------------
    connection.query('insert into user_logs set ?', {  UL_MCI_ID: obj.UI_MCI_ID,UL_USERNAME: obj.UI_USERNAME,UL_PASSWORD: obj.UI_PASSWORD,UL_ACCESS_TOKEN: token_id,UL_DATE: Adate,UL_TIME: Atime }, function(err, result) {
     if (err) throw err;
    
     console.log(result.insertId);
   });
   //------------------------------------------END OF CODE -------------------------------------------------------------------
   
   
   
   
   
   }
   
   }
   
   });
   
   }
   
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //----When the actio is sync
   else if (querryData.action ==='sync')
   {
 
   //-------------Checking the access token-------------------------
   connection.query('select * from user_logs where ul_access_token =?',[querryData.access_token],function (err, results){
    if (err){
    throw(err);
    }
   else
   {
   if (results.length ===0){
    //----------------Access token not correct--------
     
    console.log('User has no Access......');
     
   }
   else
   {
   //----------------Access token correct-----------
    console.log('User has Access......');
    
    
    //=====================================================================================================================================
   //=====================================================================================================================================
   //=====================================================================================================================================
    //---------SYNC REQUEST FOR DAILY INCOMES TABLE-----------------------------------------------------------------------------
    if (querryData.table ==='daily_incomes'){
    console.log('Request for daily incomes');
    //--------------------------------------------selecting data from the DAILY INCOMES TABLE-----------------------------------------------------------------
   connection.query('select * from daily_incomes where di_mci_id =? and di_sync_status =?',[querryData.clinic_id,'N'], function (err, results){
   if (err){
   
   throw(err);
   
   }
   else
   {
   
   //-------checking the results from the query-----------
   
   //-------is there is no data
   if (results.length ===0){
   
   
    res.end(JSON.stringify([]));
   
   
   }
   else
   {
   //---there is unsynched data
   
   
   //------Updating the sync status
   for (var i = 0; i < results.length; i++){
   
          var trans_record = results[i];  
 		     var trans_obj = JSON.parse(JSON.stringify(trans_record));
               
               //updating the sync status 
               connection.query('UPDATE daily_incomes SET  di_sync_status =? where di_id =?',['Y',trans_obj.DI_ID], function (err, results){
               if (err){
               
               throw(err);
               }
               else
               {
               
               
               }
               
               
               
               
               
               });
               
               
               
 
 		}
   console.log(JSON.stringify(results));
   res.end(JSON.stringify(results));
   }
   //----------------------------------------------------- 
   
   
   
   
   
   }
    
   });
   
   //------------------------------------------------------END OF QUERY--------------------------------------------------------
   //=====================================================================================================================================
   //=====================================================================================================================================
   //=====================================================================================================================================
    
    }
    
    
    //=====================================================================================================================================
   //=====================================================================================================================================
   //=====================================================================================================================================
    //=======================================================================================================================
    //--------SYNC REQUEST FOR LAB INCOMES
    else if (querryData.table ==='lab_statistics')
    {
   
    
    console.log('Request for Lab Statistics');
     //--------------------------------------------selecting data from the DAILY INCOMES TABLE-----------------------------------------------------------------
   connection.query('select * from lab_statistics where ls_mci_id =? and ls_sync_status =?',[querryData.clinic_id,'N'], function (err, results){
   if (err){
   
   throw(err);
   
   }
   else
   {
   
   //-------checking the results from the query-----------
   
   //-------is there is no data
   if (results.length ===0){
   
   
    res.end(JSON.stringify([]));
   
   
   }
   else
   {
   //---there is unsynched data
   
   
   //------Updating the sync status
   for (var i = 0; i < results.length; i++){
   
          var trans_record = results[i];  
 		     var trans_obj = JSON.parse(JSON.stringify(trans_record));
               
               //updating the sync status 
               connection.query('UPDATE lab_statistics SET  ls_sync_status =? where ls_id =?',['Y',trans_obj.LS_ID], function (err, results){
               if (err){
               
               throw(err);
               }
               else
               {
               
               
               }
               
               
               
               
               
               });
               
               
               
 
 		}
   console.log(JSON.stringify(results));
   res.end(JSON.stringify(results));
   }
    
   }
    
   });
   
   //------------------------------------------------------END OF QUERY--------------------------------------------------------
 
    
    
    }
    
    //=====================================================================================================================================
   //=====================================================================================================================================
   //=====================================================================================================================================
    
    
    
    
    //=====================================================================================================================================
    //=====================================================================================================================================
    //=====================================================================================================================================
    //-----------------------------------INCOME SUMMARY SYNC REQUEST
    else if (querryData.table ==='income_summary')
    {
    
    console.log('Request for Income Summary');
     //--------------------------------------------selecting data from the DAILY INCOMES TABLE-----------------------------------------------------------------
   connection.query('select * from income_summary where is_mci_id =? and is_sync_status =?',[querryData.clinic_id,'N'], function (err, results){
   if (err){
   
   throw(err);
   
   }
   else
   {
   
   //-------checking the results from the query-----------
   
   //-------is there is no data
   if (results.length ===0){
   
   
    res.end(JSON.stringify([]));
   
   
   }
   else
   {
   //---there is unsynched data
   
   
   //------Updating the sync status
   for (var i = 0; i < results.length; i++){
   
          var trans_record = results[i];  
 		     var trans_obj = JSON.parse(JSON.stringify(trans_record));
               
               //updating the sync status 
               connection.query('UPDATE income_summary SET  is_sync_status =? where is_id =?',['Y',trans_obj.IS_ID], function (err, results){
               if (err){
               
               throw(err);
               }
               else
               {
               
               
               }
               
               
               
               
               
               });
               
               
               
 
 		}
   console.log(JSON.stringify(results));
   res.end(JSON.stringify(results));
   }
    
   }
    
   });
   
   //------------------------------------------------------END OF QUERY--------------------------------------------------------
    
    
    
    
    
    
    
    
    
    
    
    }
    //=====================================================================================================================================
    //=====================================================================================================================================
    //=====================================================================================================================================
    //----------------------------------------------------------ELSE----------------------------
    else
    {
    
    }
    
    
    
    
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   }
   }
   
   });
   
   ///--------------------End of Check------------------------------
   
 
  
   
   
   }
   
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   
   
   
   
   
   
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //----When the actio is sync
   else if (querryData.action ==='data_upload')
   {
  
 
    //==============================================================================================================
    //                                           INCOME SUMMARY TABLE    
    //==============================================================================================================
    if (querryData.table ==='income_summary')
    {   
    var _=require("underscore");
   var jsonObject=JSON.parse(querryData.data);
   _.each(jsonObject, function(data_obj) {
   var row =JSON.parse(JSON.stringify(data_obj));
   connection.query('SELECT * FROM income_summary WHERE is_date = ? and is_mci_id =?',[row.IS_DATE,row.IS_MCI_ID] , function(err, result) {
   if (err) throw err;
    if (result.length ==0){
    
     //-----------------------------INSERTING INTO INCOME_SUMMARY TABLE -------------------------------------------------------
      //console.log(Iarr[i]);
    connection.query('insert into income_summary set ?',row, function(err, result) {
     if (err) throw err;
    
     console.log(result.insertId);
   });
   //------------------------------------------END OF CODE -------------------------------------------------------------------
    
    }
    else
    {
    
     //---UPDATE
     //-----------------------------UPDATING THE INCOME_SUMMARY TABLE -------------------------------------------------------
    connection.query('update income_summary set is_con_amount = ?,is_lab_amount =?,is_proce_amount =?,is_pharm_amount =?,is_rad_amount =?,is_den_amount =?,is_utilities_amount =?,is_extra_amount =?,is_grand_amount =? where is_date =?',[row.IS_CON_AMOUNT,row.IS_LAB_AMOUNT,row.IS_PROCE_AMOUNT,row.IS_PHARM_AMOUNT,row.IS_RAD_AMOUNT,row.IS_DEN_AMOUNT,row.IS_UTILITIES_AMOUNT,row.IS_EXTRA_AMOUNT,row.IS_GRAND_AMOUNT,row.IS_DATE] , function(err, result) {
     if (err) throw err;
    
     console.log(result.insertId);
   });
   //------------------------------------------END OF CODE -------------------------------------------------------------------
    
    } 
   });
   });
   
   //====================
   
   res.end(JSON.stringify({resp:"pass"}));
  
    }
    
    //==============================================================================================================
    //                                           END OF CODE  
    //==============================================================================================================
 
   
   
    //==============================================================================================================
    //                                           DAILY INCOME TABLE   
    //==============================================================================================================
   else if (querryData.table ==='daily_income')
   {
   
   var _=require("underscore");
   var jsonObject=JSON.parse(querryData.data);
   _.each(jsonObject, function(data_obj) {
   
   var row =JSON.parse(JSON.stringify(data_obj));
   connection.query('SELECT * FROM daily_incomes WHERE di_date = ? and di_mci_id =?',[row.DI_DATE,row.DI_MCI_ID] , function(err, result) {
   if (err) throw err;
   
   if (result.length ==0){
    //-----------------------------INSERTING INTO DAILY INCOME TABLE -------------------------------------------------------

    connection.query('insert into daily_incomes set ?',row, function(err, result) {
     if (err) throw err;
    
     console.log(result.insertId);
   });
   //------------------------------------------END OF CODE -------------------------------------------------------------------
   }
   else
   {
   
   //-----------------------------UPDATING THE DAILY_INCOME TABLE -------------------------------------------------------
    connection.query('update daily_incomes set DI_TOTAL_AMOUNT = ?,DI_AMOUNT_PAID =?,DI_AMOUNT_NOT_PAID =?,DI_EXPENSE =? where di_date =?',[row.DI_TOTAL_AMOUNT,row.DI_AMOUNT_PAID,row.DI_AMOUNT_NOT_PAID,row.EXPENSE,row.DI_DATE] , function(err, result) {
     if (err) throw err ;
    
     console.log(result.insertId);
   });
   }
   
   });
   
   });
   
   res.end(JSON.stringify({resp:"pass"}));
   
   
   
   
   } 
    //==============================================================================================================
    //                                           END OF CODE  
    //==============================================================================================================
    
    
    
     //==============================================================================================================
    //                                           LAB STATISTICS  
    //==============================================================================================================
 
 else if (querryData.table ==='lab_statistics')
 {
 
  var _=require("underscore");
   var jsonObject=JSON.parse(querryData.data);
   _.each(jsonObject, function(data_obj) {
   
   var row =JSON.parse(JSON.stringify(data_obj));
   connection.query('SELECT * FROM lab_statistics WHERE ls_date = ? and ls_mci_id =?',[row.DI_DATE,row.DI_MCI_ID] , function(err, result) {
   if (err) throw err;
   
   if (result.length ==0){
    //-----------------------------INSERTING INTO  INCOME TABLE -------------------------------------------------------

    connection.query('insert into lab_statistics set ?',row, function(err, result) {
     if (err) throw err;
    
     console.log(result.insertId);
   });
   //------------------------------------------END OF CODE -------------------------------------------------------------------
   }
   else
   {
   
   //-----------------------------UPDATING THE DAILY_INCOME TABLE -------------------------------------------------------
    connection.query('update lab_statistics set LS_TOTAL_PATIENT_VISITS = ?,LS_TOTAL_TESTS_DONE =?,LS_TOTAL_REV_GEN =? where ls_date =?',[row.LS_TOTAL_PATIENT_VISITS,row.LS_TOTAL_TESTS_DONE,row.LS_TOTAL_REV_GEN,row.LS_DATE] , function(err, result) {
     if (err) throw err ;
    
     console.log(result.insertId);
   });
   }
   
   });
   
   });
   
   res.end(JSON.stringify({resp:"pass"}));
   
 
 
 
 
 
 }
 //==============================================================================================================
    //                                           END OF CODE  
    //==============================================================================================================
 
   
   
   }



   
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   //####################################################################################################################################################################
   
   
   else{
   
   res.end("Access Denied");
   
   }
   
   
   
   //--------------------------------------END OF CODE --------------
   
   
   
   
   }).listen(8080, "0.0.0.0");
   console.log('Server running at http://0.0.0.0:8080');
   //------------------------------------------END Of Code ----------------------------------------------------	
