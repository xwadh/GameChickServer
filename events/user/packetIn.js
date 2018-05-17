let updateMgr = require('../../util/updateMgr');
let time5 = new updateMgr(5000);
let commonFunc = require('../../util/commonFunc');
/**
 * Created by admin on 2017-05-26.
 */
function handle(data) { //客户端上行消息
    data.user.baseMgr.vip.checkActivityStatus();//检测并修复排名活动的相关信息
    //获取并下发世界聊天消息
    this.service.chat.Query(data.user);
    //累计游玩时间
    let d1 = (Date.parse(new Date()) < Date.parse(new Date("October 23,2017 0:0:0")) && Date.parse(new Date()) >= Date.parse(new Date("October 21,2017 0:0:0")))?true:false;
    let d2 = (Date.parse(new Date()) < Date.parse(new Date("October 30,2017 0:0:0")) && Date.parse(new Date()) >= Date.parse(new Date("October 28,2017 0:0:0")))?true:false;
    let d3 = (Date.parse(new Date()) < Date.parse(new Date("November 6,2017 0:0:0")) && Date.parse(new Date()) >= Date.parse(new Date("November 4,2017 0:0:0")))?true:false;
    if(d1 || d2 || d3){
        let temp  = commonFunc.now() - data.user.totalTime;
        data.user.totalTime = commonFunc.now();
        data.user.baseMgr.task.Execute(this.const.em_Condition_Type.totalTime, temp, this.const.em_Condition_Checkmode.add);
    }
    //获取并下发私聊消息
    //data.user.privateChatMgr.Query();
    // data.user.tick();
    if (time5.check()) {
        //判断是否开启七夕活动
        this.remoteCallReturn('service', {
            sname: 'dailyactivity',
            sfunc: 'CheckButtonStatus',
            params: [data.user.domain, data.user.openid]
        });     
    }
}

module.exports.handle = handle;