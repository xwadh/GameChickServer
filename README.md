#chickServer

2017.5.11
    1、新增WebSocket接口
    2、引入服务器之间RPC机制
    3、添加后台管理界面

2017.5.12
    1、完善注册判断，避免混服现象

2017.5.14
    服务端框架扩展：
    1、整合短连、长连的路由和报文解析
    2、封装RPC调用机制
    3、完善后台管理平台的功能


2017.5.26: events目录下放置 Logic Server 内部使用的消息句柄文件，对应的消息类型为消息句柄文件的局部路径拼接字符串（从events开始）
    例如：
        user/afterLogin.js输出 handle 函数，作为对"user.afterLogin"消息的处理句柄
        socket/userKick.js输出 handle 函数，作为对"socket.userKick"消息的处理句柄

    注：理论上目录可以无穷嵌套，但必须能准确表达消息的合理分类
    注：句柄文件中的this指针由外部注入，指向Facade门面对象

2017.5.58:
    1、新增关卡管理系统
    2、新增体力值
    3、新增家族系统

2017.5.30:
    1、新增回头率统计数据
    2、新增注册、消费、在线统计数据

注：Sequelize模型中，默认必须存在id字段作为Primary key，如果无此字段会造成插入异常

2017.6.29:
    1、新增分段积分系统
    2、新增新手引导管理系统

2017.6.30:
    1、普查所有await语句，添加try结构，预防未处理的reject导致系统异常
    2、核查内部RPC机制，避免内部通讯异常导致的功能失灵

2017.7.2：
    1、好友在线状态显示问题：用户上线时看到的好友在线状态都是离线，要等到好友重新上线后才会更新为在线
    2、头像图片服务器偶尔报异常：使用Request取代了原先的Promise模式
    3、好友列表分数为0
    4、好友中出现自己
    5、好友排行中重复出现
    6、好友界面头像可能没有

2017.7.12:
    mysql>show variables like 'max_connections';    (查可以看当前的最大连接数)
    msyql>set global max_connections=1000;          (设置最大连接数为1000，可以再次查看是否设置成功)    

    npm list 检查下依赖关系，对缺失的包手工安装下。

2017.8.13:
    1、新增CLI应用，可以向运行中的程序发布实时指令，例如：关闭Socket接口、强制保存用户数据，最后关闭进程

2017.8.26 Redis客户端整改方案：
    1、找出数据更新不及时、失败的深层原因，了解Node-Redis的断线重连机制
    2、对Redis常用功能进一步封装，包括哈希、集合、KV，以及游标操作
    3、应对Node异步操作可能带来的数据同步问题