let {BonusType, ActivityType, em_Condition_Type, em_Condition_Checkmode, ReturnCode, NotifyType, DomainType, UserStatus} = require('../../../const/comm');

/**
 * Created by liub on 2017-08-4.
 * 
 * 奴隶复仇事件处理句柄
 * 
 * *事件句柄中，this指向门面对象，也就是facadeBase，data.user指向事件的接收用户对象，data.msg为事件内容
 */
function handle(data) {
    let msg = data.msg;
    if(msg.info.src == data.user.openid){//奴隶主
        //发送一封邮件
        if(!!msg.info.bonus){
            delete msg.info.bonus;
        }
        this.service.mails.add(data.user, msg, "system", data.user.openid);
    }
    else if(msg.info.dst == data.user.openid) {//奴隶
        data.user.notify(msg);
    }
}

module.exports.handle = handle;