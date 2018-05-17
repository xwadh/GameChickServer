/**
 * 属性管理类的父类
 */
class baseMgr {
    constructor(parent, attribute){
        this.v = {};
        this.parent = parent;
        this.dirty = false; //脏数据标志
        //用于持久化的字段名
        this.attribute = attribute;
    }

    /**
     * 获取脏数据标志
     * @returns {*}
     */
    get dirty(){
        return this.isDirty;
    }

    /**
     * 设置脏数据标志
     * @param val
     */
    set dirty(val){
        this.isDirty = val;
        if(this.isDirty){
            this.parent.router.notifyEvent('user.update', {id:this.parent.id});
        }
    }

    /**
     * 获取数据
     * @returns {{}|*}
     */
    _QueryInfo() {
        return this.v;
    }
    /**
     * 获取序列化字符串，同时复位脏数据标志
     * @note 子类可重载此方法
     */
    ToString(){
        this.dirty = false;
        return JSON.stringify(this.v);
    }
    /**
     * 利用来自持久化层的数据进行初始化
     * @note 子类可重载此方法 但此方法只是载入数值，所以无论如何不能引发 dirty 值的改变进而在载入阶段就引发数据库回写
     */
    _Init (val) {
        try{
            this.v = (!val||val == "" ) ? {} : JSON.parse(val);
        }
        catch(e){
            //JSON解析失败
        }
    }
}

exports = module.exports = baseMgr;

//加入其他属性:
//exports.sth = something;