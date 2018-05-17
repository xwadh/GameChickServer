let {DomainType} = require('../../const/comm');

/**
 * Created by admin on 2017-05-26.
 */
function handle(data) {//用户注册时，必要的初始化工作
    //console.log(`${data.user.openid}在${this.sysCur.serverType}.${this.sysCur.serverId}上创建游戏角色`);

    data.user.getBonus({type: "role", id:1001, num:1});
    data.user.getBonus({type: "scene", id:18, num:1});
    data.user.getBonus({type: "road", id:3001, num:1});
    data.user.baseMgr.info.role = 1001;     //默认角色
    data.user.baseMgr.info.scene = 18;      //默认场景
    data.user.baseMgr.info.road = 3001;     //默认道路
    data.user.baseMgr.info.score = 0;       //默认分数

    // if(!this.sysCur.debug){
    //     switch(data.user.domainType) {
    //         case DomainType.TX:
    //             this.service.txApi.Report_Regaccount(data.user.openid).then(apiRet=>{
    //                 if(apiRet.ret != 0){
    //                     console.log(`Report_Regaccount Error: ${JSON.stringify(aipRet)}`);
    //                 }
    //             }).catch(e=>{});
    //             this.service.txApi.Report_Regchar(data.user.openid).then(apiRet=>{
    //                 if(apiRet.ret != 0){
    //                     console.log(`Report_Regchar Error: ${JSON.stringify(aipRet)}`);
    //                 }
    //             }).catch(e=>{});
    //             break;
    //     }
    // }

}

module.exports.handle = handle;