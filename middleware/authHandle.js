let CommonFunc = require('../util/commonFunc');
let {UserStatus, DomainType, GetDomainType} = require('../const/comm');

/**
 * 游戏玩家认证鉴权
 * @param sofar
 * @returns {Promise.<void>}
 */
async function handle(sofar) {
    let ret = { ret: 0 };

    try {
        //根据令牌进行鉴权
        let userId = await sofar.facade.service.users.authUserByToken(sofar.msg.oemInfo.token);
        if (!!userId) {
            sofar.socket.user = sofar.facade.service.users.GetUser(userId);
        }

        if (!sofar.socket.user || sofar.msg.type == "login"/*如果是login则强制重新验证*/) {
            //针对各类第三方平台，执行一些必要的验证流程：
            switch(GetDomainType(sofar.msg.oemInfo.domain)) {
                case DomainType.TX: { //QQ游戏开发平台, 前向校验下用户的合法性
                        if (!sofar.facade.sysCur.debug) {
                            ret = await sofar.facade.service.fbApi.Get_Info(sofar.msg.oemInfo.openid, sofar.msg.oemInfo.openkey, sofar.msg.oemInfo.pf, sofar.msg.userip);
                        }
                        if (ret.ret != 0) { //验证未通过
                            //sofar.facade.counter.inc(); //pm2监控：错误计数，目前已经禁用
                            sofar.fn({ code: sofar.facade.const.ReturnCode.authThirdPartFailed, data: ret });
                            sofar.recy = false;
                            return;
                        }
                        ret.openid = sofar.msg.oemInfo.openid;
                        ret.openkey = sofar.msg.oemInfo.openkey;
                        ret.pf = sofar.msg.oemInfo.pf;
                        break;
                    }

                case DomainType.D360: {//360平台，本地校验
                        // auth = {
                        //     t: 当前时间戳，游戏方必须验证时间戳，暂定有效 期为当前时间前后 5 分钟
                        //     nonce: 随机数
                        //     plat_user_id: 平台用户 ID
                        //     nickname: 用户昵称
                        //     avatar: 头像
                        //     is_tourist: 是否为游客
                        // };
                        let _sign = (sofar.msg.oemInfo.auth.sign == sofar.facade.tools.sign(sofar.msg.oemInfo.auth, sofar.facade.sysCur[DomainType.D360].game_secret));
                        let _exp = (Math.abs(sofar.msg.oemInfo.auth.t - CommonFunc.now()) <= 300);
                        if (!_sign || !_exp) {
                            sofar.fn({ code: sofar.facade.const.ReturnCode.authThirdPartFailed });
                            sofar.recy = false;
                            return;
                        }
                        //360认证模式不同于TX，此处要对domainId、openid重新赋值
                        sofar.msg.oemInfo.openid = sofar.msg.oemInfo.auth.plat_user_id;
                        sofar.msg.domainId = sofar.msg.oemInfo.domain + '.' + sofar.msg.oemInfo.openid;
                        break;
                    }
            }
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
            else if (!!sofar.msg.oemInfo.openid) {//	新玩家注册
                sofar.msg.func = 'login'; //强制登录

                let name = '鸡小德' + CommonFunc.GetRandomInt(10000, 99999);	  //随机名称
                let appId = '';												    //应用ID
                let serverId = '';												//服务器ID

                let oemInfo = sofar.msg.oemInfo;
                if (oemInfo.userName) {
                    name = oemInfo.userName;
                }
                if (oemInfo.appId) {
                    appId = oemInfo.appId;
                }
                if (oemInfo.serverId) {
                    serverId = oemInfo.serverId;
                }

                usr = await sofar.facade.service.users.CreateNewUser(name, oemInfo.domain, oemInfo.openid);
                if (!!usr) {
                    //写入账号信息
                    usr.WriteUserInfo(appId, serverId, CommonFunc.now(), sofar.msg.oemInfo.token);
                    sofar.facade.notifyEvent('user.newAttr', {user: usr, attr:[{type:'uid', value:usr.id}, {type:'name', value:usr.name}]});
                }
            }

            if (!!usr) {
                usr.socket = sofar.socket; //更新通讯句柄
                usr.userip = sofar.msg.userip;
                sofar.socket.user = usr;

                //test only：模拟填充测试数据/用户头像信息
                if(sofar.facade.sysCur.debug){
                    ret.figureurl = sofar.facade.DataConst.user.icon;
                }

                sofar.facade.notifyEvent('user.afterLogin', {user:usr, objData:sofar.msg});//发送"登录后"事件
                if(usr.domainType == DomainType.TX) { //设置腾讯会员属性
                    await usr.SetTxInfo(ret); //异步执行，因为涉及到了QQ头像的CDN地址转换
                }

                usr.sign = sofar.msg.oemInfo.token;          //记录登录令牌
                usr.time = CommonFunc.now();      //记录标识令牌有效期的时间戳
                sofar.facade.service.users.userToken[usr.sign] = usr.id; //建立反向索引
            }
        }

        if (!sofar.socket.user) {//未通过身份校验
            sofar.fn({ code: sofar.facade.const.ReturnCode.userIllegal });
            sofar.recy = false;
        }
        else {
            console.log(`鉴权成功, OpenId/Token: ${sofar.msg.oemInfo.openid}/${sofar.msg.oemInfo.token}`);
            //分发用户上行报文的消息，可以借此执行一些刷新操作
            sofar.facade.notifyEvent('user.packetIn', {user: sofar.socket.user});
        }
    }
    catch (e) {
        console.log(e);
        sofar.fn({ code: sofar.facade.const.ReturnCode.illegalData, data: ret });
        sofar.recy = false;
    }
}

module.exports.handle = handle;
