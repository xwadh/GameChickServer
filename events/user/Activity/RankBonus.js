/**
 * Created by admin on 2017-07-20.
 */
let {NotifyType, ActivityRankBonus} = require('../../../const/comm');

/**
 * 活动中的分段积分奖励激活事件
 * @param {*} data 
 */
function handle(data) {
    //下行奖励通知
    data.user.notify({
        type: NotifyType.activityRankBonus, 
        info: {
            bonus: ActivityRankBonus[this.service.activity.type][data.rank].bonus, 
            rank: data.rank, 
            status: 0
        }
    });
}

module.exports.handle = handle;
