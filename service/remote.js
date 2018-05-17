/**
 * 跨服调用
 * updated by liub 2017.9.18
 */
class remote {
    constructor(parent){
        this.parent = parent;
    }

    /**
     * 跨服远程调用范例：传入一个参数，返回该参数
     * @param {*} num 
     */
    test(num1, num2, obj){
        return [num1, num2, obj];
    }
}

module.exports = remote;
