let {DomainType, UserStatus} = require('../../const/comm');
let commonFunc = require('../../util/commonFunc');
/**
 * Created by admin on 2017-05-26.
 */
function handle(data) {//用户签退
    // console.log(`${data.user.openid}退出游戏, 持续${now() - data.user.loginTime}秒`,this.sysCur.debug);
    switch(data.user.domainType) {
        case DomainType.TX:
            //在线状态发生变化
            data.user.baseMgr.info.UnsetStatus(UserStatus.online);
            let onlinetime = commonFunc.now() - data.user.loginTime;
            //累计游玩时间
            let d1 = (Date.parse(new Date()) < Date.parse(new Date("October 23,2017 0:0:0")) && Date.parse(new Date()) >= Date.parse(new Date("October 21,2017 0:0:0")))?true:false;
            let d2 = (Date.parse(new Date()) < Date.parse(new Date("October 30,2017 0:0:0")) && Date.parse(new Date()) >= Date.parse(new Date("October 28,2017 0:0:0")))?true:false;
            let d3 = (Date.parse(new Date()) < Date.parse(new Date("November 6,2017 0:0:0")) && Date.parse(new Date()) >= Date.parse(new Date("November 4,2017 0:0:0")))?true:false;
            if(d1 || d2 || d3){
                let temp  = commonFunc.now() - data.user.totalTime;
                data.user.totalTime = commonFunc.now();
                data.user.baseMgr.task.Execute(this.const.em_Condition_Type.totalTime, temp, this.const.em_Condition_Checkmode.add);
            }
            // if(!this.sysCur.debug){
            //     this.service.txApi.Report_Logout(data.user.openid, onlinetime).then(apiRet=>{
            //         if(apiRet.ret != 0){
            //             console.log(`Report_Logout Error: ${JSON.stringify(aipRet)}`);
            //         }
            //     }).catch(e=>{});
            // }
            break;

        case DomainType.SYSTEM:
            this.service.users.mapServer(data.user, true); //清理先前注册的逻辑服信息
            break;
        
        default:
            break;
    }
}

module.exports.handle = handle;