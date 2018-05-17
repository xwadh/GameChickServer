/**
 * 用户信息自动存储任务
 * 每当有需要持久化的用户数据发生变化时，就为该用户创建该自动存储任务，然后一段时间后自动执行并销毁该任务
 * 为该任务的执行添加了流量控制，避免并发写超过数据库最大连接数
 */
class autoSave
{
    constructor($id){
        this.id = $id;
    }

    /**
     * 执行逻辑，当任务到期时会被自动调用，调用后任务将被销毁
     * @param {*} facade 
     */
    execute(facade){
        let user = facade.service.users.GetUser(this.id);
        if (!!user) {
            process.nextTick(()=>{
                user.Save();
            })
        }
        return true;
    }
}

module.exports = autoSave;