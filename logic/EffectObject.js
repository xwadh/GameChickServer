let commonFunc = require('../util/commonFunc');

/**
 * 技能特权对象
 *
 * Created by liub on 2017-04-07.
 */
class EffectObject
{
    constructor($eType, $eValue, $expired = 0){
        this.type = $eType;            //特权类型
        this.value = $eValue;          //特权效果
        this.expired = $expired;       //有效期，为0表示永久有效，否则和当前时间比对
    }

    /**
     * 剩余的有效时长
     * @returns {number}
     */
    getLeftTime(){
        let $cur = commonFunc.now();
        return this.expired > $cur ? this.expired - $cur : 0;
    }

    /**
     * 设置当前时间起，向后延长的有效时长（秒）
     * @param $len
     */
    setLeftTime($len){
        this.expired = commonFunc.now() + $len;
    }

    /**
     * 叠加相同类型的特权效果对象
     * @param $eo
     */
    Add($eo) {
        if(this.type == $eo.type){
            if(this.expired == 0){
                this.value += $eo.value;//永久有效的效果，数值叠加
            }
            else{
                this.setLeftTime(this.getLeftTime() + $eo.getLeftTime());
            }
        }
    }

    /**
     * 有效性检测
     * @return bool
     */
    isValid() {
        return this.expired == 0 || $this.expired > commonFunc.now();
    }
}

exports = module.exports = EffectObject;