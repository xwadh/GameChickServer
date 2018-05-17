let CommonFunc = require('../util/commonFunc');

/**
 * 管理员认证鉴权流程
 * @param sofar
 * @returns {Promise.<void>}
 */
async function handle(sofar) {
    let ret = { ret: 0 };
    try {
        if (!sofar.socket.user || sofar.msg.type == "login"/*如果是login则强制重新验证*/) {
            if (
                (sofar.msg.oemInfo.auth.sign != sofar.facade.tools.sign(sofar.msg.oemInfo.auth, sofar.facade.sysCur.game_secret))
                || (Math.abs(sofar.msg.oemInfo.auth.t - CommonFunc.now()) > 300)) {
                sofar.fn({ code: sofar.facade.const.ReturnCode.authThirdPartFailed });
                sofar.recy = false;
                return;
            }

            //此处要对domainId、openid重新赋值
            sofar.msg.oemInfo.openid = sofar.msg.oemInfo.auth.plat_user_id;
            sofar.msg.domainId = sofar.msg.oemInfo.domain + '.' + sofar.msg.oemInfo.openid;//用户唯一标识
            sofar.msg.oemInfo.token = sofar.facade.tools.sign({ did: sofar.msg.domainId }, sofar.facade.sysCur.game_secret); //为用户生成令牌
            let usr = null;
            let id = await sofar.facade.service.users.authUserByDomainId(sofar.msg.domainId);
            if (id > 0) {//老用户登录
                usr = sofar.facade.service.users.GetUser(id);
                usr.baseMgr.info.UnsetStatus(UserStatus.isNewbie, false);
                if (!!usr.socket && usr.socket != sofar.socket) {
                    //禁止多点登录
                    sofar.facade.notifyEvent('socket.userKick', {sid:usr.socket});
                }
            }
            else if (sofar.msg.oemInfo.openid) {//	新玩家注册
                sofar.msg.func = 'login'; //强制登录
                usr = await sofar.facade.service.users.CreateNewUser('管理员' + CommonFunc.GetRandomInt(10000, 99999), sofar.msg.oemInfo.domain, sofar.msg.oemInfo.openid);
                if (!!usr) {
                    usr.sign = sofar.msg.oemInfo.token;
                    usr.time = CommonFunc.now();
                }
            }

            if (!!usr) {
                sofar.socket.user = usr;
                usr.socket = sofar.socket; //更新通讯句柄
                usr.sign = sofar.msg.oemInfo.token;          //记录登录令牌
                usr.time = CommonFunc.now();      //记录标识令牌有效期的时间戳
                sofar.facade.service.users.userToken[usr.sign] = usr.id; //建立反向索引
            }
        }

        if (!sofar.socket.user) {//未通过身份校验
            sofar.fn({ code: sofar.facade.const.ReturnCode.userIllegal });
            sofar.recy = false;
        }
    }
    catch (e) {
        sofar.fn({ code: sofar.facade.const.ReturnCode.illegalData, data: ret });
        sofar.recy = false;
    }
}

module.exports.handle = handle;
