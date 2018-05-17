let baseCtl = require('../facade/baseCtl');

/**
 * 活动功能相关的控制器
 * Created by liub on 2017-07-01.
 */
class activity extends baseCtl {
    getInfo(user){
        return {code:this.parent.const.ReturnCode.Success, data:this.parent.service.activity.getInfo(user)};
    }

    /**
     * 领取奖励
     * @param {*} user 
     * @param {*} data 
     */
    getBonus(user, data){
        data.id = parseInt(data.id || 0);
        return this.parent.service.activity.getBonus(user, data.id);
    }

    /**
     * 获取活动排名列表
     */
    getList(user){
        // info.page = info.page || 1;
        // if(typeof info.page == "string"){
        //     info.page = parseInt(info.page);
        // }
        return {code:this.parent.const.ReturnCode.Success, data:this.parent.service.activity.rankList(user.id)};
        // return {code:this.parent.const.ReturnCode.Success, data:this.parent.service.activity.rankList(user.id, info.page)};
    }
}

exports = module.exports = activity;
