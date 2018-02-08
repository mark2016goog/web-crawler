// 一些依赖库
let https= require("https"),
       c = require('child_process'),
    iconv = require('iconv-lite'),              
    superagent = require("superagent"),         
    cheerio = require("cheerio");                                       
    
let urlsArray = [];                 //存放小说每一章节的网址
const pageUrls='https://www.*.com/79_79883/';  //该小说所在的目录地址

//主程序
function start(){
    function onRequest(req, res){ 
    	let Res=res;
        //设置请求header  没有这句话请求出来的中文 会乱码
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); 
		https.get(pageUrls,function(res){
			let chunks = [];
			let size = 0;
			res.on('data',function(chunk){    //监听事件 传输数据 
		        chunks.push(chunk);
     			size += chunk.length;
 			});
 			res.on('end',function(){  //数据传输完
				let data = Buffer.concat(chunks,size); 
				//将数据转换成gbk中文数据（原网页使用的是gbk 而非utf-8）
				let decodeHtmlData = iconv.decode(data,'gbk');
				//cheerio模块开始处理 DOM处理
 				let $ = cheerio.load(decodeHtmlData, {decodeEntities: false});
 				//根据网页html结构 获取到 小说目录文字html  具体dom操作与要爬取的网站有关
 				let curPageUrls = $('#list dl').find("dt").eq(1).nextAll();
 				for(let i = 0 ; i < curPageUrls.length ; i++){
          			//查找每一目录下的链接
              		let articleUrl = curPageUrls.eq(i).find("a").attr('href');
          			urlsArray.push(pageUrls+articleUrl);
        		}
 				//判断text文件夹存不存在
	 			fs.exists("./test.txt", function(exists){
	 				//如果存在 先删除
	 				if(exists){ 
	 					fs.unlink("./test.txt", function(err){
	 						if(err){ 
							   console.log("删除失败！"); 
							}else{ 
							   console.log("删除成功！"); 
							} 
	 					})
	 				}
	 			})
 				//调用函数
 				getContent(Res);
 			})
		})
    }
    //递归函数
    function getContent(r){
    	let Res=r;
    	//当链接所在的数据为空时 返回
    	if(urlsArray.length<=0){
    		Res.write('已结束！');
    		return;
    	}
    	//发送get请求 每次请求链接数组里的第一条内容（链接）
		https.get(urlsArray[0],function(res){
			let chunks = [];
			let size = 0;
			res.on('data',function(chunk){    
		        chunks.push(chunk);
     			size += chunk.length;
 			});
 			res.on('end',function(){  //数据传输完
				let data = Buffer.concat(chunks,size); 
				//将数据转换成gbk中文数据（原网页使用的是gbk 而非utf-8）
				let decodeHtmlData = iconv.decode(data,'gbk');
				//cheerio模块开始处理 DOM处理
 				let $ = cheerio.load(decodeHtmlData, {decodeEntities: false});
 				//获取到 标题     具体dom操作获取与要爬取的网站有关
 				let title=$(".bookname h1").text();
 				//获取到 内容     具体dom操作获取与要爬取的网站有关
 				let content=$("#content").text();
 				//将标题打印到网页上
 				Res.write(title+'<br />');
 				//将内容打印到网页上
 				Res.write(content+'<br />');
 				//创建txt文件
			    fs.appendFile('./test.txt', title+'\r\n'+content+'\r\n');
 				//将链接数组的第一条数据去除
 				urlsArray.shift();
 				//重新调用该函数
 				getContent(r);
 			})
		})
    }
    //创建http请求 端口号3000
    http.createServer(onRequest).listen(3000);
    //自动打开浏览器
    c.exec('start http://localhost:3000');
}
//将主程序暴露出去
exports.start= start;
