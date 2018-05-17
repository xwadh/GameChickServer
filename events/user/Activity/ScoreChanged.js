/**
 * Created by admin on 2017-07-20.
 */
let {NotifyType, ActivityScoreBonus} = require('../../../const/comm');

/**
 * 活动中的积分发生变化事件
 * @param {*} data 
 */
function handle(data) {
    data.user.baseMgr.vip.saveActivityInfo(this.service.activity.id, data.score, data.lv); //存储活动信息
    data.user.notify({type: NotifyType.activityScore, info: data.score});
}

module.exports.handle = handle;
