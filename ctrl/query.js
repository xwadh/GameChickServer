let baseCtl = require('../facade/baseCtl');
let Indicator = require('../util/Indicator'); //标志位管理
var mysql = require('mysql');
let {ReturnCode, BonusType, UserStatus, em_Condition_Type, em_Condition_Checkmode, NotifyType, ActivityType, RankType, em_EffectCalcType,em_Effect_Comm,mapOfTechCalcType} = require('../const/comm');
class query extends baseCtl {
    test(){
        return {data:"aaaa"}; 
    }
    async getUserInfo(user,objData){
        if(!objData.db || !objData.sql){
            console.log(objData.db);
            return {code:ReturnCode.Error};  
        }
        let connection = mysql.createConnection({
            host     : '127.0.0.1',
            user     : 'root',
            password : 'helloworld',
            database : objData.db,
            port:'3306'
        });
        connection.connect(function (err) {
            if(err){
                return {code:ReturnCode.Error};
            }
        });
        try{
            let res = await (new Promise((resolve, reject)=>{
                connection.query(objData.sql, function(err, result) {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            }));
            return {code:ReturnCode.Success,data:res};        
        }catch(e){
            return {code:ReturnCode.dbError};        
        }
    }
}

exports = module.exports = query;
