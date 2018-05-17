let um = require('./updateMgr');

/**
 * 自动执行任务管理器，目前只支持同步任务
 */
class taskManager
{
    /**
     * 构造函数
     * @param {*} parent    门面对象
     * @param {*}           检测间隔，单位毫秒
     */
    constructor(parent, $interval=30000){
        this.parent = parent; //注入门面对象

        //延期自动执行任务的缓存列表
        this.updateRecord = new Set();

        //持续监控任务的缓存列表
        this.monitorRecord = {};

        //tick检测
        (new um($interval)).tick(0, ()=>{
            this.checkTask();
        });
    }

    /**
     * 新增任务
     */
    addTask(task){
        this.updateRecord.add(task);
    }

    addMonitor(monitor){
        this.monitorRecord[monitor.id] = monitor;
    }

    /**
     * tick事件句柄
     */
    checkTask() {
        let facade = this.parent;

        //执行定时监控任务，当不再需要监控时，就从监控列表中删除
        for(let id of Object.keys(this.monitorRecord)){
            if(this.monitorRecord[id].execute(facade)){
                delete this.monitorRecord[id];
            }
        }
        
        let recy = facade.sysCur.PoolMax / 2; //控制并发数量的循环变量
        //执行数据更新任务
        this.updateRecord.forEach(task => {
            if(--recy > 0){
                if(task.execute(facade)){
                    this.updateRecord.delete(task);
                }
            }
        });

        //updateRecord缓存了需要延期执行的任务，在系统关闭前必须反复调用checkTask，直至列表尺寸为0
        return this.updateRecord.size;
    }
}

module.exports = taskManager;