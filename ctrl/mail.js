let baseCtl = require('../facade/baseCtl');
let {ActivityType, NotifyType, ActionExecuteType, em_Condition_Type, BonusType, OperEnum, ReturnCode} = require('../const/comm');

/**
 * 邮箱管理器
 * Updated by liub on 2017-07-26.
 */
class mail extends baseCtl {
    /**
     * 读取邮件列表 - 一次性发送，不分页，最多30条
     * @param {*} user 
     * @param {*} objData 
     */
    async getList(user, objData)
    {
        let list = this.parent.service.mails.inbox(user);
        return {code: ReturnCode.Success, data: list};
    }

    /**
     * 向指定用户发送一封文本邮件
     * @param {*} user 
     * @param {*} objData 
     */
    async send(user, objData)
    {
        //考虑到用户可能跨服，这里使用好友间的notify转发下
        user.socialNotify(
            {type: NotifyType.mail, info: {src: user.openid, dst: objData.openid, con:objData.con}},
            objData.openid
        );
        return {code: ReturnCode.Success};
    }

    /**
     * 删除一篇邮件
     * @param {*} user 
     * @param {*} objData 
     */
    async del(user, objData)
    {
        await this.parent.service.mails.delete(user, objData.idx);
        return {code: ReturnCode.Success, data:{idx:objData.idx}};
    }

    /**
     * 阅读了一篇邮件
     * @param {*} user 
     * @param {*} objData 
     */
    async read(user, objData)
    {
        await this.parent.service.mails.read(user, objData.idx);
        return {code: ReturnCode.Success, data: {idx:objData.idx}};
    }
}

exports = module.exports = mail;
