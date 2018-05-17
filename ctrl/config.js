let baseCtl = require('../facade/baseCtl');
let Indicator = require('../util/Indicator'); //标志位管理
let {ReturnCode, BonusType, UserStatus, em_Condition_Type, em_Condition_Checkmode, NotifyType, ActivityType, RankType, em_EffectCalcType,em_Effect_Comm,mapOfTechCalcType} = require('../const/comm');

/**
 * 配置管理器
 * Updated by liub on 2017-05-05.
 */
class config extends baseCtl {
    /**
     * 查询并返回配置文件
     * @param user
     * @param objData
     * @returns {Promise.<*>}
     */
    async get(user, objData) {
        try{
            return await this.parent.config.getConfigFile(objData.file);
        }
        catch(e){
            console.error(e);
        }
    }

    /**
     * 获取服务器列表
     * @param user
     * @param objData
     * @returns {{code: number, data: *}}
     */
    getServerList(user, objData){
        return {
            code:this.parent.const.ReturnCode.Success,
            data:this.parent.service.users.forServers(srv=>{
                return `${srv.stype}.${srv.sid}`;
            }),
        };
    }

    /**
     * 为客户端分配远程访问地址和端口
     * @param pUser
     * @param info
     * @returns {{ret: boolean, data: {ip: *, port}}}
     */
    async getServerInfo(pUser, info){
        try{
            //优先路由:强制切换到Test域
            if(this.parent.testRoute.has(info.oemInfo.openid)){
                info.oemInfo.domain = info.oemInfo.domain.replace(/IOS/g, "Test").replace(/Android/g, "Test");
            }

            //判断是否已注册
            let ui = await this.parent.getUserIndex(info.oemInfo.domain, info.oemInfo.openid, true);
            if(!!ui){
                //向目标逻辑服发送预登录信息
                let ret = await this.parent.remoteCallReturn(ui, "userPreLogin", info.oemInfo);
                if(ret.code == this.parent.const.ReturnCode.Success){
                    return {
                        code: this.parent.const.ReturnCode.Success,
                        //注意：返回的是服务器的mapping地址
                        data: {
                            newbie: Indicator.inst(ui.status).check(UserStatus.isNewbie), 
                            ip: this.parent.serversInfo[ui.stype][ui.sid].webserver.mapping, 
                            port:this.parent.serversInfo[ui.stype][ui.sid].webserver.port
                        }
                    };
                }
                else{
                    return ret;
                }
            }
        }
        catch(e){
            console.error(e);
        }
        return {code: this.parent.const.ReturnCode.Error};
    }
}

exports = module.exports = config;
