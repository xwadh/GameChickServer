/**
 * 积分排名活动监控任务对象
 * 在系统启动时，会创建一个唯一的活动监控对象，并持久保存在缓存列表中
 */
class activityMonitor
{
    constructor(){
        this.id = `system_activity`;  //特殊任务编号
    }

    /**
     * 执行逻辑。
     * @return
     *      true    ：状态失效，监控任务将被移出队列，不再接受检测
     *      false   ：状态有效，监控任务继续停留在队列中，接受后续检测
     */
    execute(facade){
        //console.log('积分活动定时检测');
        facade.service.activity.checkStatus();
        return false;
    }
}

module.exports = activityMonitor;