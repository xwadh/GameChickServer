/**
 * 单元测试：facebook api
 * Creted by fan 2017.12.12
 */
let {ActionExecuteType, NotifyType, ReturnCode} = require('../const/comm');
let remote = require('../util/clientComm')();

describe.skip('fbapi', function() {
    it('facebook test', done =>{
        remote.auth().fetch({func:'test',id:'118935915563834',access:'EAAEbE7cMEpABAMKgBevneMZAZB90gfFcR8llr6pIuo6gwinX7PqpzZCd5mTki2vPAm9oZCZCrL35Cc76no7iYx8dq93KpgD7f1dXoZAeZCyU5WWtOyYSrN0LDWHSFCfc3uGM7CZAs9P6IdcDHavTz3K8Wzlk3kijyKYB1ziWiypNmXEUZAnlv5cPLHssuSxzCJTK1Y69qnDOZBTPELF8PakM10cVM96rNBhbmFD7lHc6oxXyIRhPJ2kCU8'}, msg=>{
            console.log(msg)    //{code:0, data:{hisGateNo:最高关卡, list:[id, star, score, state, time/*标志开始时间的时间戳*/]}}
            done();
        });
    });

});
