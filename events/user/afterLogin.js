/**
 * Created by liub on 2017-05-26.
 */
let {DomainType, UserStatus} = require('../../const/comm');
let commonFunc = require('../../util/commonFunc');

/**
 * 用户登录后，用来执行一些后续操作，例如获取腾讯会员信息、蓝钻特权等
 * @note 事件处理函数，this由外部注入，指向Facade
 * @param data
 */
function handle(data){
    data.user.loginTime = commonFunc.now(); //记录登录时间
    data.user.totalTime = data.user.loginTime;
    //console.log(`${data.user.openid}进入游戏`);

    data.curTime = new Date();//记录当前时间，为后续流程提供统一的时间标尺
    let oem = data.objData.oemInfo;
     switch(data.user.domainType){
           case DomainType.TX: { //腾讯大厅 如果是腾讯的用户才做这个
               if(this.sysCur.debug){
                   break;
               }
               //this.service.txApi.Report_Login(data.user.openid).then(apiRet=>{
                   //if(apiRet.ret != 0){
                       //console.log(`Report_Login Error: ${JSON.stringify(aipRet)}`);
                   //}
               //}).catch(e=>{});
               data.user.SetOpenKey(oem.openkey);
               data.user.SetPf(oem.pf);
               break;
           }
      }
    let d1 = data.curTime.toDateString();
    let d2 = data.user.getRefreshDate(); //缓存用户最近登录日期, 因为checkDailyData会修改该数值，而该数值后续判断还需要使用
    //todo:判断是否开启七夕活动
    this.remoteCallReturn('service', {
        sname:'dailyactivity', 
        sfunc:'CheckButtonStatus',
        params:[data.user.domain, data.user.openid]
    });

    //如果跨天推送一条消息
    if(d1 != d2){
        data.user.notify({type:this.const.NotifyType.DailyEvent});
    }

    //检测用户跨天数据
    data.user.checkDailyData(d1);
    //判断系统每日榜是否跨天
    this.control.rank.checkDailyRank(d1);

    //记录用户登录行为
    if(data.user.baseMgr.action.Execute(this.const.ActionExecuteType.AE_Login, 1, true)){
        data.user.baseMgr.task.Execute(this.const.em_Condition_Type.totalLogin, 1, this.const.em_Condition_Checkmode.add);//记录累计登录
        if(Date.parse(data.curTime)/1000 - Date.parse(d2)/1000 < 3600*48){
            data.user.baseMgr.task.Execute(this.const.em_Condition_Type.loginContinue, 1, this.const.em_Condition_Checkmode.add);//记录连续登录
        }
    }

    try{
        data.user.baseMgr.info.SetStatus(UserStatus.online, false);

        //刷新资源、体力值
        data.user.baseMgr.vip.checkActivityStatus();//检测并修复排名活动的相关信息
        data.user.baseMgr.info.AutoAddAP();//	刷新体力

        data.user.notify({type: this.const.NotifyType.action, info: data.user.baseMgr.info.getActionData()});
        data.user.notify({type: this.const.NotifyType.actions, info: data.user.baseMgr.action.getInfo()});
    }
    catch(e){
        console.error(e);
    }
}

module.exports.handle = handle;