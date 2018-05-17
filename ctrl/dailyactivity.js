let baseCtl = require('../facade/baseCtl');
let {BonusType, ReturnCode} = require('../const/comm');
/**
 * 活动功能相关的控制器
 * Created by liub on 2017-07-01.
 */
class dailyactivity extends baseCtl {
    async getInfo(user){
        return await this.parent.remoteCallReturn('service', {
            sname:'dailyactivity', 
            sfunc:'getInfo', 
            params:[user.domain, user.openid]
        });
    }

    /**
     * 获取活动排名列表
     */
    async getList(user){
        return {
            code: this.parent.const.ReturnCode.Success, 
            data: await this.parent.remoteCallReturn('service', {
                sname:'dailyactivity', 
                sfunc:'getList',
                params:[user.domain, user.openid]
            })
        };
    }

    async addProp(user,data){
        return await this.parent.remoteCallReturn('service', {
            sname:'dailyactivity', 
            sfunc:'addProp', 
            params:[user.domain, user.openid, data.choose, data.num]
        })
    }

    async setScore(user,data){
        return await this.parent.remoteCallReturn('service', {
            sname:'dailyactivity', 
            sfunc:'setScore', 
            params:[user.domain, user.openid, data.id]
        })
    }

    // async joinActivity(user){
    //     return await this.parent.remoteCallReturn('service', {
    //         sname:'dailyactivity',
    //         sfunc:'joinActivity',
    //         params:[user.domainId]
    //     })
    // }

    // choose(user,data){
    //     return this.parent.service.dailyactivity.choose(user.id,data.id);
    // }
    async countChoose(user,data){
        return await this.parent.remoteCallReturn('service', {
            sname:'dailyactivity', 
            sfunc:'countChoose', 
            params:[]
        })
    }
    async countProp(user){
        return await this.parent.remoteCallReturn('service', {
            sname:'dailyactivity', 
            sfunc:'countProp', 
            params:[]
        })
    }
    async checkJoin(user){
        return await this.parent.remoteCallReturn('service', {
            sname:'dailyactivity', 
            sfunc:'checkJoin', 
            params:[user.domain, user.openid]
        })
    }
    async toJoin(user){
        let cost = 20;
        if(user.baseMgr.info.GetRes(BonusType.Diamond) >= cost){
            let ret = await this.parent.remoteCallReturn('service', {
                sname:'dailyactivity', 
                sfunc:'toJoin', 
                params:[user.domain, user.openid]
            });
            if (ret.code == ReturnCode.Success){
                user.baseMgr.info.SubRes(BonusType.Diamond, cost);
            }
            return ret;
        }
        else {
            return {code:ReturnCode.DiamondNotEnough};
        }
    }
}
exports = module.exports = dailyactivity;
