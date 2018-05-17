let baseMgr = require('../facade/baseMgr');
let {em_Effect_Comm, ActionExecuteType, NotifyType} = require('../const/comm');
let commonFunc = require('../util/commonFunc');
let config = require('../util/configInterface');  //配置文件管理
let DataConst = config.fileMap.DataConst;

/**
 * 指定行为的每日最大执行次数，所有行为都要在这里登记
 */
let ExecuteMaxNumList = {};
ExecuteMaxNumList[ActionExecuteType.AE_Login] =  DataConst.Execute.AE_Login;        //每日登录
ExecuteMaxNumList[ActionExecuteType.AE_SocialOfFail] = DataConst.Execute.AE_SocialOfFail;  //每日社交分享
ExecuteMaxNumList[ActionExecuteType.AE_SocialOfAction] = DataConst.Execute.AE_SocialOfAction; //每日送出体力
ExecuteMaxNumList[ActionExecuteType.AE_SlaveCatch] = DataConst.Execute.AE_SlaveCatch; 
ExecuteMaxNumList[ActionExecuteType.AE_SocialOfSuper] = DataConst.Execute.AE_SocialOfSuper; 
ExecuteMaxNumList[ActionExecuteType.AE_SlaveEscape] = DataConst.Execute.AE_SlaveEscape;
ExecuteMaxNumList[ActionExecuteType.slaveAvenge] = DataConst.Execute.slaveAvenge;
ExecuteMaxNumList[ActionExecuteType.slaveCommend] = DataConst.Execute.slaveCommend; 
ExecuteMaxNumList[ActionExecuteType.slaveFlattery] = DataConst.Execute.slaveFlattery; 
ExecuteMaxNumList[ActionExecuteType.slaveFood] = DataConst.Execute.slaveFood; 
ExecuteMaxNumList[ActionExecuteType.slaveLash] = DataConst.Execute.slaveLash; 
ExecuteMaxNumList[ActionExecuteType.vipDaily] = DataConst.Execute.vipDaily; 

/**
 * 用户每日行为管理类，限制每日可执行次数限制
 */
class action extends baseMgr {
    constructor(parent){
        super(parent, 'hudong');
    }

    getInfo(){
        let $now = commonFunc.now();
        let ret = {};

        ret.num = this.v.num;
        ret.extNum = {};
        Object.keys(ActionExecuteType).map($type=>{
            let _num = this.GetExtraNum(ActionExecuteType[$type]);
            if(_num > 0){
                ret.extNum[ActionExecuteType[$type]] = _num;
            }
        });

        ret.time = {};
        Object.keys(this.v.time).map(key=>{
            ret.time[key] = Math.max(0, this.v.time[key] + this.GetCd(key) - $now);
        });
        ret.max = ExecuteMaxNumList;

        return ret;
    }

    /**
     * 重置记录
     */
    Reset(){
        this.v.num = {};
        this.v.extNum = {};
        this.v.time = {};
        this.isDirty = true;

        this.parent.notify({type: NotifyType.actions, info: this.getInfo()});
    }

    /**
     * 指定的限定行为是否可执行. isExec true判断并执行 false仅判断
     * 失败的原因包括：
     *      1、次数受限
     *      2、CD受限
     *
     * @param $_type
     * @param int $sum
     * @param bool $isExec
     * @return bool
     */
    Execute($_type, $sum = 1, $isExec = false) {
        let $now = commonFunc.now();

        if(!!this.v.num[$_type]){
            let lm = this.GetLeftNum($_type);
            if(lm < $sum){
                return false;
            }
            if(!!this.v.time[$_type]){
                if($now - this.v.time[$_type] < this.GetCd($_type)){
                    return false;
                }
            }

            if($isExec){
                this.v.num[$_type] += $sum;
                if(this.GetCd($_type)>0){
                    this.v.time[$_type] = $now; //记录最新执行时间
                }
                this.isDirty = true;

                this.parent.notify({type: NotifyType.actions, info: this.getInfo()});
            }
        }
        else{
            if($isExec){
                this.v.num[$_type] = $sum;
                if(this.GetCd($_type)>0){
                    this.v.time[$_type] = $now; //记录最新执行时间
                }
                this.isDirty = true;

                this.parent.notify({type: NotifyType.actions, info: this.getInfo()});
            }
            else{
                this.v.num[$_type] = 0;
            }
        }
        return true;
    }

    _Init(val){
        super._Init(val);

        if(!this.v){
            this.v = {};
        }
        if(!this.v.num){
            /**
             * 用户行为次数登记
             */
            this.v.num = {};
        }
        if(!this.v.extNum){
            /**
             * 额外的执行次数
             * @var array
             */
            this.v.extNum =  {};
        }
        if(!this.v.time){
            /**
             * 最后执行的时间
             * @var array
             */
            this.v.time =  {};
        }
    }

    /**
     * 执行记录减少，恢复到至少可以再执行一次的状态
     * @param $_type
     * @param int $sum
     */
    Roolback($_type, $sum = 1){
        if(!!this.v.num[$_type]){
            this.v.num[$_type] = Math.min(ExecuteMaxNumList[$_type].num - $sum, Math.max(0, this.GetExecuteNum($_type) - $sum));
            this.isDirty = true;

            this.parent.notify({type: NotifyType.actions, info: this.getInfo()});
        }
    }

    /**
     * 读取已执行次数
     * @param $_type
     * @return mixed
     */
    GetExecuteNum($_type)    {
        if(!!this.v.num[$_type]){
            return this.v.num[$_type];
        }
        return 0;
    }

    /**
     * 为指定行为添加额外的执行次数，可以在商城购买，或者活动中赠送
     * @param $_type
     * @param $added
     */
    AddExtraNum($_type, $added){
        if(!this.v.extNum){
            this.v.extNum = {};
        }

        if(!!this.v.extNum[$_type]){
            this.v.extNum[$_type] += $added;
        }
        else{
            this.v.extNum[$_type] = $added;
        }
        this.isDirty = true;

         this.parent.notify({type: NotifyType.actions, info: this.getInfo()});
    }

    /**
     * 读取指定行为的额外执行次数
     * @param $_type
     * @return int|mixed
     */
    GetExtraNum($_type){
        let cur = 0;
        if(!!this.v.extNum){
            cur = !!this.v.extNum[$_type] ? this.v.extNum[$_type] : 0;
            if(this.isInterOperation($_type) == em_Effect_Comm.InterOperation){
                cur = this.parent.refreshEffect().CalcFinallyValue(em_Effect_Comm.InterOperation, cur);
            }
        }
        return cur;
    }

    /**
     * 获取互动行为的类型
     * @param {*}  
     */
    isInterOperation($_type){
        switch($_type){
            case ActionExecuteType.slaveAvenge:
            case ActionExecuteType.slaveCommend:
            case ActionExecuteType.slaveFlattery:
            case ActionExecuteType.slaveFood:
            case ActionExecuteType.slaveLash:
                return em_Effect_Comm.InterOperation;

            default:
                return em_Effect_Comm.None;
        }
    }

    /**
     * 读取剩余行次数
     * @param $_type
     */
    GetLeftNum($_type) {
        let ex = this.GetExtraNum($_type);
        let max = ExecuteMaxNumList[$_type].num;
        let cur = this.GetExecuteNum($_type)
        return ex + max - cur;
    }

    /**
     * 指定行为的CD时间
     * @param {*}  
     */
    GetCd($_type){
        if(!!ExecuteMaxNumList[$_type]){
            return ExecuteMaxNumList[$_type].cd;
        }
        return 0;
    }

    /**
     * 清除指定类型的记录数
     * @param $_type
     */
    ClearRecord($_type) {
        if(!!this.v.num[$_type]){
            this.v.num[$_type] = 0;
            this.isDirty = true;

            this.parent.notify({type: NotifyType.actions, info: this.getInfo()});
        }
    }
}

exports = module.exports = action;