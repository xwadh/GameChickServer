let md5 = require('md5');

//	检查参数错误 - 有错误则返回 true
function CheckReqError(type, id, info) {
	if (!type) {
		return false;
	}
	if (!id) {
		
	}
	return false;
}
//	转换成0 以上的整数 -- 最小为 0;
function ZeroBaseInt(num) {
	var ret = parseInt(num);
	if (ret < 0) {
		ret = 0;
	}
	return ret;
}
//	判断对象是否为空
function IsEmptyObject(e) {
	var t;
	for (t in e)  
		return !1;  
	return !0;
}
//	获取映射长度
function GetMapLength(mapOjb) {
	if (!mapOjb) {
		return 0;
	}
	var t;
	var iLength = 0;
	for (t in mapOjb)  {
		++iLength;
	}
	return iLength;
}
// Returns a random integer between min (included) and max (excluded)
function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 等待若干毫秒后继续执行
 * @param {number}  - 等待的时间长度，单位毫秒
 */
async function wait($inv){
    console.log(`waiting ${$inv/1000}s...`);
    await (new Promise(resolve=>{
        setTimeout(()=>{
            resolve();
        }, $inv);
    }));
}

/**
 * Get current time in unix time (milliseconds).
 * @returns {Number}
 */
function ms() {
    if(!!Date.now){
        return Date.now();
    }
    else{
        return +new Date();
    }
};

/**
 * Get current time in unix time (seconds).
 * @returns {Number}
 */
function now() {
    return Math.floor(ms() / 1000);
};
    
/**
 * 复制一个对象
 * @param obj
 * @returns {*}
 */
function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    if (obj instanceof Date) {// Handle Date
        let copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    else if (obj instanceof Array) {// Handle Array
        let copy = [];
        for (let i = 0, len = obj.length; i < len; ++i) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    else if (obj instanceof Object) {// Handle Object
        let copy = {};
        for (let attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

/**
 * 生成MD5签名：排除数组/对象中的 sign 字段/属性
 * @param $data     数组/对象，加密时将所有键值对排序后串接起来
 * @param secret    附加加密串，缀于串接字符串之后
 *
 * @note 采用标准md5算法，返回最终加密字符串，计算过程没有改变 $data
 */
function genGameSign($data, secret){
    //delete $data.sign;
    let base = '';
    Object.keys($data).sort().map(key=>{
        if(key != 'sign'){
            base += key + $data[key];
        }
    });
    return md5(base + secret);
}

/**
 * 扩展对象
 * @returns {*|{}}
 */
function extendObj(){
    /*
     　　*target被扩展的对象
     　　*length参数的数量
     　　*deep是否深度操作
     　　*/
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;

    // target为第一个参数，如果第一个参数是Boolean类型的值，则把target赋值给deep
    // deep表示是否进行深层面的复制，当为true时，进行深度复制，否则只进行第一层扩展
    // 然后把第二个参数赋值给target
    if ( typeof target === "boolean" ) {
        deep = target;
        target = arguments[1] || {};

        // 将i赋值为2，跳过前两个参数
        i = 2;
    }

    // target既不是对象也不是函数则把target设置为空对象。
    if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
        target = {};
    }

    // 如果只有一个参数，则把jQuery对象赋值给target，即扩展到jQuery对象上
    if ( length === i ) {
        target = this;

        // i减1，指向被扩展对象
        --i;
    }

    // 开始遍历需要被扩展到target上的参数
    for ( ; i < length; i++ ) {
        // 处理第i个被扩展的对象，即除去deep和target之外的对象
        if ( (options = arguments[ i ]) != null ) {
            // 遍历第i个对象的所有可遍历的属性
            for ( name in options ) {
                // 根据被扩展对象的键获得目标对象相应值，并赋值给src
                src = target[ name ];
                // 得到被扩展对象的值
                copy = options[ name ];

                if ( src === copy ) {
                    continue;
                }

                // 当用户想要深度操作时，递归合并
                // copy是纯对象或者是数组
                if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
                    // 如果是数组
                    if ( copyIsArray ) {
                        // 将copyIsArray重新设置为false，为下次遍历做准备。
                        copyIsArray = false;
                        // 判断被扩展的对象中src是不是数组
                        clone = src && jQuery.isArray(src) ? src : [];
                    } else {
                        // 判断被扩展的对象中src是不是纯对象
                        clone = src && jQuery.isPlainObject(src) ? src : {};
                    }

                    // 递归调用extend方法，继续进行深度遍历
                    target[ name ] = jQuery.extend( deep, clone, copy );

                    // 如果不需要深度复制，则直接把copy（第i个被扩展对象中被遍历的那个键的值）
                } else if ( copy !== undefined ) {
                    target[ name ] = copy;
                }
            }
        }
    }

    // 原对象被改变，因此如果不想改变原对象，target可传入{}
    return target;
};

/**
 * 获取某个时间格式字符串的时间戳
 */
function getUnixtime(data){
    if(!data){
        return Date.parse(new Date());
    }
    else {
        return Date.parse(new Date(data));
    }
}
/**
 * 获取某两个个时间格式字符串的时间戳的差值
 * (now < date1 && now >= date2)?true:false
 */
function getPeriod(data1,data2){
    return (getUnixtime() < getUnixtime(data1) && getUnixtime() >= getUnixtime(data2))?true:false;
}
//	函数导出
exports.CheckReqError	= CheckReqError;
exports.ZeroBaseInt		= ZeroBaseInt;
exports.IsEmptyObject	= IsEmptyObject;
exports.GetMapLength	= GetMapLength;
exports.GetRandomInt	= GetRandomInt;
exports.clone = clone;
exports.extendObj = extendObj;
exports.sign = genGameSign;
exports.wait = wait;
exports.now = now;
exports.ms = ms;
exports.getUnixtime = getUnixtime;
exports.getPeriod = getPeriod;
