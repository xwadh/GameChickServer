let baseMgr = require('../facade/baseMgr');
let constList = require('../const/comm');
let TaskObject = require('../logic/TaskObject');
let TaskStaticList = {};

//从静态配置表中遍历全部任务
Object.keys(constList.StaticTaskList).map($k=>{
    //创建新对象
    let $taskObj = new TaskObject();
    $taskObj.id = $k;

    //从静态配置表中取条件阈值和奖励信息
    $taskObj.loadFromStatic();

    //将对象放入任务列表
    TaskStaticList[$taskObj.id]= $taskObj;
});

/**
 * 任务管理器
 * 从User表中获取任务完成情况表，从配置表中获取静态任务列表，两者联合处理，得出最终的待完成任务列表
 */
class task extends baseMgr {
    constructor(parent){
        super(parent, 'login');
        this.taskList = {}; //当前可执行任务列表
    }

    createTaskObj($k){
        if(!!TaskStaticList[$k]){
            //创建新对象
            let $taskObj = new TaskObject();
            $taskObj.id = $k;

            //从静态配置表中取条件阈值和奖励信息
            $taskObj.loadFromStatic();

            //将对象放入任务列表
            this.taskList[$taskObj.id]= $taskObj;

            return $taskObj;
        }
        return null;
    }

    /**
     * 反序列化任务数据
     * @param {*} $params
     */
    _Init($params){
        $params.split('+').map($value=>{
            if($value != ''){
                //从序列化串中，填充基本信息
                let $itemArray = $value.split('|');
                let $taskInfo = $itemArray[0].split(',');
                if($taskInfo.length >= 2){
                    let $taskObj = this.createTaskObj(parseInt($taskInfo[0]));
                    if(!!$taskObj){
                        $taskObj.status = parseInt($taskInfo[1]);
                        if($taskInfo.length >= 3){
                            $taskObj.time = parseInt($taskInfo[2]);
                        }
                        $itemArray[1].split(';').map($value1=>{
                            let $conItem = $value1.split(',');
                            $taskObj.conditionMgr.fillCurValue(parseInt($conItem[0]), parseInt($conItem[1]));
                        });
                    }
                }
            }
        });
    }

    /**
      * 序列化任务信息，用于信息持久化
      * task_str = 任务信息|条件信息[+更多任务]
      *  任务信息 = 任务ID，任务状态
      *  条件信息 = 条件编号，条件当前值[;更多条件]
      */
    ToString(){
        let $ret = '';
        Object.keys(this.taskList).map($key=>{
            if($ret != ''){
                $ret = $ret + '+';
            }
            $ret = $ret + this.taskList[$key].ToString();
        });
        return $ret;
    }

    /**
     * 拥有指定条件的任务
     */
    hasCondition(condition){
        let list = Object.keys(this.taskList).map($key=>{
            if(this.taskList[$key].conditionMgr.hasCondition(condition)){
                return this.taskList[$key];
            }
        });

        return finish => {
            return list.map(it=>{
                if(finish == it.conditionMgr.finished()){
                    return it;
                }
            });
        };
    }

    /*
     * 领取任务奖励: -1表示任务不存在，-2表示任务条件不满足，其余表示奖励字符串
     */
    getBonus($tid){
        if(!!this.taskList[$tid]){
            let $taskObj = this.taskList[$tid];//检索现有对象
            if($taskObj.status == constList.em_task_status.finished){
                return '-1';
            }
            else if($taskObj.status == constList.em_task_status.award || $taskObj.conditionMgr.finished()){
                switch($taskObj.getType()){
                    case constList.em_task_type.main:
                    case constList.em_task_type.daily:
                        $taskObj.status = constList.em_task_status.finished;
                        break;
                    case constList.em_task_type.recy:
                        $taskObj.Init();
                        break;
                }
                this.isDirty = true;//设置脏数据标志

                //执行领取奖励操作
                return $taskObj.GetBonus(this.parent);
            }
            else{
                return '-2';
            }
        }
        else{
            return '-1';
        }
    }

    /**
     * 初始化每日任务
     */
    InitDailyTask(){
        Object.keys(this.taskList).map($key=>{
            if(this.taskList[$key].getType() == constList.em_task_type.daily){
                this.taskList[$key].Init();
            }
        });
        this.isDirty = true;//设置脏数据标志
        return this;
    }

    /**
     * 条件发生变化时调用
     * @param $ctype        //条件类型
     * @param $num          //条件值
     * @param $mode         //检测方式：绝对值/累积值
     */
    Execute($ctype, $num, $mode){
        Object.keys(TaskStaticList).map($key=>{//遍历所有静态任务，因为有可能多个任务里都用到了同样的条件
            if(!this.taskList[$key] && TaskStaticList[$key].conditionMgr.hasCondition($ctype)){
                this.createTaskObj($key); //创建新的动态任务
            }
        });

        Object.keys(this.taskList).map($key=>{//遍历所有任务，因为有可能多个任务里都用到了同样的条件
            let ret = this.taskList[$key].Execute($ctype, $num, $mode);
            if(ret == true){
                this.isDirty = true;//设置脏数据标志
                this.parent.router.notifyEvent('user.taskFinished', {user:this.parent, objData:{id:$key}});//发送"任务完成"事件
            }
            else if(ret != false){
                this.isDirty = true;//设置脏数据标志
                this.parent.router.notifyEvent('user.taskChanged', {user:this.parent, objData:{id:$key, data:ret}});//发送"任务完成"事件
            }
        });
    }

    /**
     * 已完成的每日任务数量
     */
    FinishedTaskDaily(){
        return Object.keys(this.taskList).filter($key=>{return this.taskList[$key].status == constList.em_task_status.award && this.taskList[$key].getType() == constList.em_task_type.daily}).length;
    }

    /**
     * 已完成的主线任务数量
     */
    FinishedTask(){
        return (Object.keys(this.taskList).filter($key=>{
            return this.taskList[$key].status == constList.em_task_status.award && (this.taskList[$key].getType() == constList.em_task_type.main || this.taskList[$key].getType() == constList.em_task_type.recy)
        })).length;
    }

    /**
     * 获取指定的任务对象
     * @param $key
     * @returns {*}
     */
    getTaskObj($key){
        if(!!this.taskList[$key]){
            return this.taskList[$key];
        }
        return null;
    }

    /**
     * 获取指定分类的任务列表
     * @param $type
     * @returns {*}
     */
    getList($type = 0, $status = 0){
        switch($type){
            case 0:
                if($status == -1){
                    return Object.keys(this.taskList).map($k=>{
                        return this.taskList[$k].toClient();
                    });
                }
                else{
                    return Object.keys(this.taskList).filter($key=>{ return this.taskList[$key].status == $status}).map($k=>{
                        return this.taskList[$k].toClient();
                    });
                }
            default:
                return Object.keys(this.taskList).filter($key=>{ return this.taskList[$key].status == $status && this.taskList[$key].getType() == $type}).map($k=>{
                    return this.taskList[$k].toClient();
                });
        }    
    }
};

exports = module.exports = task;
