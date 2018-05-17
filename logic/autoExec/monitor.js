let {UserStatus} = require('../../const/comm');

/**
 * VIP监控任务对象
 * 在系统启动时，会为所有VIP用户创建监控对象，然后定期监控用户VIP有效性，失效时返回true，此后该监控任务将被从列表中移除
 */
class monitor
{
    /**
     * 构造函数
     * @param {*}  传入VIP用户的id
     */
    constructor($id){
        this.id = `vip.${$id}`;     //设置任务ID
        this.uid = $id;             //保存用户ID
    }

    /**
     * 执行逻辑。
     * @return
     *      true    ：状态失效，监控任务将被移出队列，不再接受检测
     *      false   ：状态有效，监控任务继续停留在队列中，接受后续检测
     */
    execute(facade){
        //console.log(this.uid, 'VIP检测');
        let user = facade.service.users.GetUser(this.uid);
        if (!!user) {
            //检测VIP是否有效，如果失效则返回true
            if(user.baseMgr.vip.valid){
                user.baseMgr.info.SetStatus(UserStatus.isVip);
                return false;
            }

            user.baseMgr.info.UnsetStatus(UserStatus.isVip);
        }
        return true;
    }
}

module.exports = monitor;