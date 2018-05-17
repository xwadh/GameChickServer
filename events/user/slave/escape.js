let {BonusType, ActivityType, em_Condition_Type, em_Condition_Checkmode, ReturnCode, NotifyType, DomainType, UserStatus} = require('../../../const/comm');

/**
 * Created by liub on 2017-08-4.
 * 
 * 奴隶起义事件处理句柄
 * 
 * *事件句柄中，this指向门面对象，也就是facadeBase，data.user指向事件的接收用户对象，data.msg为事件内容
 */
function handle(data) {
    let msg = data.msg;

    if(msg.info.src == data.user.openid){//奴隶主收到起义消息
        if(msg.info.code == ReturnCode.Success){
            [msg.info.code, msg.info.time] = data.user.baseMgr.slave.removeSlave(msg.info.dst);
        }
    }
    else if(msg.info.dst == data.user.openid) {//奴隶收到起义消息
        if(msg.info.code == ReturnCode.Success){
            [msg.info.code, msg.info.time] = data.user.baseMgr.slave.removeMaster(msg.info.src);
        }
    }
    data.user.notify(msg);
}

module.exports.handle = handle;