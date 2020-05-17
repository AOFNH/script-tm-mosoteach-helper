// ==UserScript==
// @name         云班课高效助手
// @author       bellamy.n.h
// @namespace    http://tampermonkey.net/
// @version      1.60
// @description  【视频相关功能来啦 😊  新增 “视频连播” 、 “立即看完” 】  添加下载按钮，可批量下载资源，可按资源栏缩小范围进行批量处理资源，高效使用云班课。【***请勿滥用***】【注意：执行完毕后需刷新页面】【自用脚本，根据个人需求开发，只做了chrome适配，其他浏览器可用，但具体操作会有点不同】【如果好用就留着用吧😀，不好用给点建议也好🙇‍】
// @match        https://www.mosoteach.cn/web/index.php*
// @include      *://www.mosoteach.cn/web/index.php*
// @note         Version 1.60    新增测试功能，支持 连续播放所有视频、 立即看完当前视频（测试阶段，还请反馈）
// @note         Version 1.50    加强对输入值约束； 支持多栏处理； chrome浏览器自动打开 设置页面地址更改； 其他Bug修复。
// @note         Version 1.40    优化代码；  新增浏览器类型判断，支持chrome浏览器自动打开 设置页面。
// @note         Version 1.32    优化操作反馈 （可以重置已选择的资源栏数）
// @note         Version 1.31    修复可能存在的Bug (页面无法自动关闭)
// @grant        GM_openInTab
// ==/UserScript==


$(function() {
	'use strict';

	/**
	 *  Determine the browser type
	 */
	function browserType() {
		var userAgent = navigator.userAgent; //get browser userAgent string
		var isOpera = userAgent.indexOf("Opera") > -1;
		if (isOpera) {
			return "Opera"
		}; //is Opera or not
		if (userAgent.indexOf("Firefox") > -1) {
			return "FF";
		} //is Firefox or not
		if (userAgent.indexOf("Chrome") > -1) {
			return "Chrome";
		}
		if (userAgent.indexOf("Safari") > -1) {
			return "Safari";
		} //is Safari or not
		if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera) {
			return "IE";
		}; //is IE or not
	}
	/**
	 *  sleep function
	 *  @param numberMillis -- 要睡眠的毫秒数
	 */
	function sleep(numberMillis) {
		var now = new Date();
		var exitTime = now.getTime() + numberMillis;
		while (true) {
			now = new Date();
			if (now.getTime() > exitTime)
				return;
		}
	}

	/**
	 * Remove duplicate value
	 */
	function removeDuplicate(arr) {
		let x = new Set(arr);
		return [...x];
	}
	/**
	 *   download resources function
	 */
	function download(name, href) {
		var a = document.createElement("a"), //创建a标签
			e = document.createEvent("MouseEvents"); //创建鼠标事件对象
		e.initEvent("click", false, false); //初始化事件对象
		a.href = href; //设置下载地址
		a.download = name; //设置下载文件名
		a.dispatchEvent(e); //给指定的元素，执行事件click事件
	}

	// Refresh page tips
	function refreshPage() {
		alert("操作完成，请小可爱刷新页面查看结果！！！");
	}
	//取消操作
	function cancel() {
		alert("已取消操作！");
	}
	/**
	 *  点击和下载前以弹窗二次确认
	 *  modeName
	 *  return boolean
	 **/
	function popupComfirm(modeName) {
		let conf_str = false;
		conf_str = confirm("小可爱，你即将执行“" + modeName + "”操作！！！" + "\n\n" +
			"根据选择资源数量的不同，会打开相应数量的页面，如果数量较多，请不要惊慌，因为这些页面会自动关闭的哦！！！" + "\n\n" +
			"你是否按照上一个提示，进行了相应的操作？" + "\n\n" + "如果是，你是否要开始执行本次操作？");
		return conf_str;
	}

	/**
	 * 数据清洗    inputString -> idsArr
	 */

	function cleanData(inputString) {
		//去除字符串中的所有空格
		inputString.replace(/\s*/g, "");
		//去掉首尾的 - 字符
		if (inputString.charAt(0) == "-") {
			if (inputString.charAt(inputString.length - 1) == "-")
				inputString = inputString.substring(1, inputString.length - 1);
			else
				inputString = inputString.substring(1, inputString.length);
		} else if (inputString.charAt(inputString.length - 1) == "-") {
			inputString = inputString.substring(0, inputString.length - 1);
		}
		//console.log(inputString + "/" + inputString.charAt(0) +"/" + inputString.charAt(inputString.length-1));
		//分割出要点击的栏号，存入数组，用于映射出对应的资源栏id
		let idsArr = inputString.split("-");
		//去重并排序
		idsArr = removeDuplicate(idsArr).sort();
		//去除超出资源栏总数的无效值
		let temp = [];
		for (let i = 0; i < idsArr.length; i++) {
			// console.log("srcBarSum is" + srcBarSum);
			if (idsArr[i] <= srcBarSum && idsArr[i] > 0) {
				temp.push(idsArr[i]);
				// console.log("temp is" + temp);
			}
		}
		// console.log("idsArr is" + idsArr);
		return idsArr = temp;

	}

	/**
	 *  根据模式名执行对应的批量处理操作
	 *
	 *  点击确认按钮弹出确认弹窗，
	 *  如果确认执行，则执行点击操作，
	 *  否则执行 取消操作
	 */
	function batchForMoreSrcBars(modeName, ids) {
		if (ids.length == 0)
			ids.push(".res-row-box");

		let isDownloadMode = modeName == "模拟点击" ? "false" : (modeName == "批量下载" ? "true" : "其他");

		if (popupComfirm(modeName)) {
			try {
				// console.log(chosenIDs);
				let startIndex = $("#head").val();
				let endIndex = $("#tail").val();
				for (let id of ids) {
					// console.log(thisID);
					try {
						batch(isDownloadMode, id, startIndex, endIndex);
					} catch (e) {
						console.log(id + "该栏执行异常，跳过执行");
						continue;
					}
				}
			} finally {
				//点击完成，提示刷新页面
				setTimeout(refreshPage, 0);
				//置空栏号输入框
				$(".indexNum").val("");

			}
		} else {
			cancel();
		}
	}

	/**
	 *  Click or download in bulk according to
	 *  isDownload : true -> Download Mode  ;  false -> Click Mode
	 *  thisBarID  : 此次要执行的资源栏 id
	 *  startIndex : 此次资源栏中执行的开始资源编号
	 *  endIndex   : 此次资源栏中执行的结束资源编号
	 *
	 */
	function batch(isDownload, thisBarID, startIndex, endIndex) {
		//let isDownloadMesg = isDownload == "false" ? "模拟点击" : "批量下载";

		//  以下五个等价，实现相同功能，但写法是逐步优化
		//  var list = document.getElementsByClassName("res-row-open-enable");
		//  var list = $(".res-row-open-enable");
		//  var list = $(".hide-div").children();
		//  var list = $(".res-row-box").children(".hide-div").children();
		let list = $(thisBarID).children(".hide-div").children();
		let succNum = 0;
		let failNum = 0;
		let tempUrl;
		let win;

		let actualStartIndex = startIndex <= list.length && startIndex > 0 ? startIndex : (startIndex <= 0 ? 1 : list.length); //小于0则为 1 ； 大于 最大值 则为 最大值
		let actualEndIndex = endIndex <= list.length && endIndex > 0 ? endIndex : (endIndex <= 0 ? 1 : list.length); //输入值超出资源总数的值，则将输入值置为总数的值
		if (actualStartIndex > actualEndIndex) {
			console.log("here");
			alert("小可爱😀，你的起始结束值写反了哟！");
			return;
		}
		// console.log("actualStartIndex: " + actualStartIndex);
		// console.log("actualEndIndex: " + actualEndIndex);
		// list 存在并不为空
		if (null == list || list.size() == 0) {
			console.log(thisBarID + "对应的资源栏为空");
		} else {

			for (let i = actualStartIndex - 1; i < actualEndIndex; i++) {
				// console.log(i);
				// console.log(list);
				// console.log(list[i]);
				try {

					tempUrl = list[i].getAttribute("data-href");
					if (null == tempUrl || tempUrl == "") {

						console.log("资源栏：" + thisBarId + "的第 " + (i + 1) + " 条资源未获取到URL");

					} else {

						win = window.open(tempUrl);
						if (isDownload == 'false') {
							sleep(100); //睡眠，是为了确保每个资源都被正常获取
							win.close();
						}
						succNum++;
						// console.log(tempUrl);

					}
				} catch (e) {
					console.log(e.name + ": " + e.message);
					console.log("资源栏：" + thisBarId + "的第 " + (i + 1) + " 条未成功执行 ；URL :   " + list[i].getAttribute("data-href"));
					failNum++;
					continue;
				}
			}

		}
		console.log("共检索到 " + list.length + "条； 成功执行 " + succNum + " 次！ 失败 " + failNum + " 次！ 操作范围：从第 " + actualStartIndex + " 条 至 第 " + actualEndIndex + " 条。");
	}
	/**
	 *  click all resources in two ways according to 'isPositive'
	 */
	function clickAll(isPositive) {

		let isPositiveMesg = isPositive == "true" ? "正序点击" : "倒序点击";

		let conf_str = false;
		conf_str = confirm("小可爱，你即将执行“" + isPositiveMesg +
			"全部资源”操作，如果资源量较大（> 1000），耗时就会较久，打开的页面也会较多哦！不过都会自动关闭的哦！！！" + "\n\n" +
			"小可爱，资源较多时，还请三思啊！！！" + "\n\n" + "你是否要执行？");
		if (conf_str) {
			let list = document.getElementsByClassName("res-row-open-enable");
			let succNum = 0;
			let failNum = 0;
			let tempUrl;
			let win;
			if (isPositive == "true") {
				for (let i = 0; i < list.length; i++) {
					try {
						tempUrl = list[i].getAttribute("data-href");
						win = window.open(tempUrl);
						sleep(100); //睡眠，是为了确保每个资源都被正常获取
						win.close();
						succNum++;
						// console.log(tempUrl);
					} catch (e) {
						console.log(e.name + ": " + e.message);
						console.log("该条未成功执行 ；URL :   " + list[i].getAttribute("data-href"));
						failNum++;
						continue;
					}
				}
			} else {
				for (let i = list.length - 1; i >= 0; i--) {
					try {
						tempUrl = list[i].getAttribute("data-href");
						win = window.open(tempUrl);
						sleep(100); //睡眠，是为了确保每个资源都被正常获取
						win.close();
						succNum++;
						// console.log(tempUrl);
					} catch (e) {
						console.log(e.name + ": " + e.message);
						console.log("该条未成功执行 ；URL :   " + list[i].getAttribute("data-href"));
						failNum++;
						continue;
					}
				}
			}
			console.log(isPositiveMesg + "：  共检索到 " + list.length + "条； 成功执行 " + succNum + " 次！ 失败 " + failNum + " 次！");
			setTimeout(refreshPage, 0);
		} else {
			alert("已取消操作！");
		}
	}

	/**
	 *  Play  all videos continuously
	 */

	function continuousPlay() {
		isContinuousPaly = true;

		if( typeof($("#continuousPlay").attr("class")) != "undefined"){
			alert("连续播放已开启,无需重复开启");
			return;
		}

		$('<div id = "continuousPlay" class="mejs__button">\
			<button type="button" aria-controls="mep_0" title="开始连续播放" aria-label="Play" tabindex="0"></button>\
			</div>\
			<div id = "stopContinuousPlay" class="mejs__button mejs__playpause-button mejs__pause">\
			<button type="button" aria-controls="mep_0" title="暂停连续播放" aria-label="Pause" tabindex="0"></button>\
			</div>').insertAfter(".mejs__fullscreen-button");

		$("#continuousPlay").click(()=>{isContinuousPaly = true;  clickDiv();});

        $("#stopContinuousPlay").click(()=>{
        	isContinuousPaly = false;
        	alert("已退出连续播放模式，但保留了关闭视频即可看完功能")
        });

		alert("连续播放已开启，请到视频页面使用");
	}

	var arr = [];
	var count = 0;
	var interval;
	var intervalTime = 4000; //millisecond
	var isContinuousPaly = false;
    var weight = 1000;

	//将所有视频资源存入数组，以作点击使用
	let a = $("div[data-mime='video']");
	Object.keys(a).forEach((key) => {
		//console.log(key, a[key]);
		arr.push(a[key]);
	});
	console.log(arr.length);
	for (let a in arr) {
		console.log(a);
	}
	//发送看完请求
	function send() {
		console.log("send start");
		console.log("关闭即看完");
		$.ajaxSetup({
			beforeSend: function() {
				let argsData = arguments[1].data
				let falseArgsData = "";
				let falseVal;
				for (let k in argsData) {

					if (k.includes("watch_to")) {
						console.log("before: " + k + " : " + argsData[k]);
						falseVal = argsData.duration;
						console.log("after: " + k + " : " + falseVal);
					}else {
						falseVal = argsData[k];
					}
					falseArgsData = falseArgsData + "&" + k + "=" + falseVal;
				}
				arguments[1].data = falseArgsData.substring(1, falseArgsData.length);
			},
			processData: false,
			complete: function() {
				console.log("send completed");
			}
		});
	}
	//单个点击视频资源DIV
	function clickDiv() {

		if(isContinuousPaly == false){
            console.log("在播放第 " + count + " 个视频时退出了连续播放");
			return;
        }


		//关闭即看完程序
		if (count == 0) {
			send();
			console.log("共要播放 " + arr.length + " 个视频");
		}

		if (count < arr.length) {
			$(arr[count]).trigger("click");
			console.log(count + " :  " + arr[count]);
			playThisVideo();
		} else {
			setTimeout(() => {
				clearInterval(interval);
			}, 0);
			console.log("结束");
			//关掉最后一个视频
			$(".close-window").trigger("click");
			alert("连续播放结束， 共连续播放了 " + arr.length + " 个视频，即将刷新页面");
			location.reload();
		}
	}

	//播放单个视频，播完即跳转下一个
	function playThisVideo() {
		if (count++ >= arr.length) {
			return;
		}

		let video = document.querySelector('video');

		let duration = video.duration;
		let currentTime = video.currentTime;
		setTimeout(() => {
			video.play();
		}, 1000);
		//second --> millisecond
		let remain = (duration - currentTime) * weight;

		console.log("该视频剩余播放时长 ：" + remain + " 毫秒");
		//停掉上一个interval
		clearInterval(interval);

		interval = setInterval(clickDiv, remain + intervalTime);

		setTimeout(() => {
				console.log("当前视频播放到：" + document.querySelector('video').currentTime);
				$(".close-window").trigger("click");
				console.log("关闭第" + count + "个视频");
				console.log(intervalTime + " 毫秒后播放下一个视频");
			},
			remain);
	}


	/**
	 *  open a new tab according the url and execute callback function
	 */
	function newTabAlert(url, option, callback) {
		GM_openInTab(url, option);
		if (typeof callback === "function") {
			callback();
		}
	}

	// css
	const styleTag = `
<style>
  .helper-btn{
     border:1px solid #aaa;
     border-radius:25px;
     width:10%;
     color:#fff;
     font-weight:1000;
     box-shadow:darkgrey 3px 3px 7px 2px;
     cursor:pointer;
     transition: .2s;
}
  .helper-btn-a:hover{
//     opacity: 0.6;    //透明度
//     background-color: #4d79ff !important;
     background-color: rgba(0, 151, 179,1) !important;
     box-shadow: darkgrey 2px 2px 5px 1px !important;
}
  .helper-btn-b:hover{
     background-color:rgba(204, 0, 0,1) !important;
}
  .helper-btn:active{
     background-color:#002b80 !important;
     border:3px solid #eee !important;
     box-shadow: darkgrey 1px 1px 2px 1px !important;
}
  #refresh{
     float:right;
     background-color:rgba(204, 0, 0,0.6);
}
  #reset{
     float:right;
     background-color:rgba(204, 0, 0,0.6);
}
  #mode-click{ background:rgba(0, 151, 179,0.7);}
  #mode-download{ background:rgba(0, 151, 179,0.7);}
  #confirm{ background:rgba(0, 151, 179,0.7);}
  #downloadSrc{ background:rgba(0, 151, 179,0.7);}
  #choose{ background:rgba(204, 0, 0,0.6);}
  //#refresh{ background:rgba(0, 151, 179,0.7);}
</style>`;
	$(styleTag).appendTo('head');

	//为每个资源添加下载按钮
	$(".res-row-open-enable").each(function() {
		if ($(this).find(".download-res-button").length > 0) return; //如果已经存在下载按钮（例如mp3），则不再添加
		$(this).find("ul").html('<li class="download-ress download-res-button">下载</li>' + $(this).find("ul").html());
		// $(this).find("ul").html('<li class="forward">正序点击</li>' + $(this).find("ul").html());
		// $(this).find("ul").html('<li class="reverse">倒序点击</li>' + $(this).find("ul").html());
	});
	//单个资源下载
	$(document).on('click', '.download-ress', function() {
		var resHref = $(this).parents(".res-row-open-enable").attr('data-href');
		window.open(resHref);
	});

	// 模拟点击  part
	$('<div id="functionAreaTitle" style="padding:0 20px">\
           <div class="clear20"></div>\
           <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="100%" color=#0BD SIZE=4>\
           <div class="clear10"></div>\
          <div class="res-row-title">\
              <span style="color: #0BD;font-weight:600; font-size:16px"> 功能区 </span>\
              <span > Powered by </span>\
              <span ><a href="https://greasyfork.org/zh-CN/scripts/390978-%E4%BA%91%E7%8F%AD%E8%AF%BE%E9%AB%98%E6%95%88%E5%8A%A9%E6%89%8B">云班课高效助手  </a></span>\
              <span style="color: red;font-weight:400; font-size:13px">  强制关闭chrome快捷键 ：Alt + F4 </span>\
              <i class="slidedown-button manual-order-hide-part icon-angle-down" data-sort="1001"></i>\
          </div>\
       </div>\
       <div class="clear20"></div>\
       <!-- helper area Start -->\
    <div id="functionAreaContent" class="hide-div" data-status="N" data-sort="1001" style="display: none;">\
       <div id="helper" style="padding:0 40px;">\
         <div class="res-row-title" >\
           <span class="res-group-name">当前模式： </span>\
           <span id="modeName" style="color: #0BD;font-weight:600">未选择 </span> |\
           <span style="color: red"> ( 选择模式后，请按照提示操作，否则会出错；“模拟点击/下载”执行完毕后需刷新页面,数据才会更新。）</span>\
           <i class="icon-angle-down slidedown-button manual-order-hide-part" data-sort="997"></i>\
         </div>\
         <div class="hide-div" data-status="N" data-sort="997" style="display: none;">\
           <form class="appendTxt res-row" style="padding:20px 20px 0px 20px ; !important">\
              <input id="mode-click" class="helper-btn helper-btn-a"  type="button" value="模拟点击">\
              <input id="mode-download" class="helper-btn helper-btn-a" type="button" value="批量下载">\
              <input id="reset" class="helper-btn helper-btn-a helper-btn-b" type="button" value="重置">\
              <input id="refresh" class="helper-btn helper-btn-a helper-btn-b" type="button" value="刷新页面">\
           </form>\
         </div>\
     <div id="module-3">\
       <div class="clear30"></div>\
        <div class="res-row-title" >\
           <span class="res-group-name" >已选栏号：</span>\
           <span id="barID" style="color: #0BD;font-weight:600"> 全选 </span> |\
           <span style="color: #0BD" >(范围： 最大值为资源栏总数 / 不填写 则视为全选)</span>\
           <span style="color: red">(注意：资源栏号是从资源区里第一栏开始)</span>\
           <i class="icon-angle-down slidedown-button manual-order-hide-part" data-sort="1000"></i>\
        </div>\
        <div class="hide-div" data-status="N" data-sort="1000" style="display: none;">\
          <form class="appendTxt res-row" style="padding:20px 20px 0px 20px ; !important">\
              <input id="bar_index" placeholder="选择栏号   [  if (value < 1) --> 1 ; if (value > max) --> max  ]      选择多栏语法： 3-2-4-6  "  \
              onkeyup="this.value=this.value.replace(/[^\\d][-]/g,\'\')" onafterpaste="this.value=this.value.replace(/[^\\d][-]/g,\'\')" style="border:1px solid #0BD; border-radius:8px;width:86%">&nbsp\
              <input id="choose" class="helper-btn helper-btn-a helper-btn-b"  type="button" value="重置">\
         </form>\
        </div>\
      </div>\
      <div id="module-1">\
       <div class="clear30"></div>\
        <div class="res-row-title" >\
           <span class="res-group-name" >模拟批量点击/下载</span>\
           <span style="color: #0BD" >(范围：以资源总数值作为范围最大值)</span>\
           <span style="color: red">( 点击对应按钮，将打开较多页面，请耐心等待其自动关闭。可在“控制台”里查看运行日志)</span>\
           <i class="icon-angle-down slidedown-button manual-order-hide-part" data-sort="998"></i>\
        </div>\
        <div class="hide-div" data-status="N" data-sort="998" style="display: none;">\
          <form class="appendTxt res-row" style="padding:20px 20px 0px 20px ; !important">\
              <input id="head" class="indexNum" placeholder="起始位置    [  if (value < 1) --> 1 ; if (value > max) --> max  ]"  style="border:1px solid #0BD; border-radius:8px;width:42%" >&nbsp\
              <input id="tail" class="indexNum" placeholder="结束位置    [  if (value < 1) --> 1 ; if (value > max) --> max  ]" style="border:1px solid #0BD; border-radius:8px;width:42%">&nbsp\
              <input id="confirm" class="helper-btn helper-btn-a"  type="button" value="模拟点击">\
              <input id="downloadSrc" class="helper-btn helper-btn-a"  type="button" value="批量下载">\
         </form>\
        </div>\
      </div>\
      <div id="module-2">\
        <div class="clear30"></div>\
        <div class="res-row-title" >\
           <span class="res-group-name" >模拟全部点击（耗时较长）</span>\
           <span style="color: #0BD" >(范围：所有资源)</span>\
           <span style="color: red">( 点击后，将会自动打开较多页面，请耐心等待其自动关闭。可在“控制台(F12 -> console)”里查看运行日志)</span>\
           <i class="icon-angle-down slidedown-button manual-order-hide-part" data-sort="999"></i>\
        </div>\
        <div class="hide-div" data-status="N" data-sort="999" style="display: none;">\
           <div class="res-row drag-res-row" style="height:37px !important">\
              <div class="operation manual-order-hide-part" style="float:left;!important">\
                 <ul style="margin-top:0px;"><li class="reverse">倒序点击</li><li class="forward">正序点击</li>\
                 <div class="clear"></div>\
                 </ul>\
              </div>\
           </div>\
        </div>\
      </div>\
      <div id="module-4">\
        <div class="clear30"></div>\
        <div class="res-row-title" >\
           <span class="res-group-name" >功能测试模块  </span>\
           <span style="color: red" >（  给个反馈可否？）</span>\
           <span style="color: red"><a href = "https://greasyfork.org/en/scripts/390978-%E4%BA%91%E7%8F%AD%E8%AF%BE%E9%AB%98%E6%95%88%E5%8A%A9%E6%89%8B/feedback">点此反馈</a></span>\
           <i class="icon-angle-down slidedown-button manual-order-hide-part" data-sort="1002"></i>\
        </div>\
        <div class="hide-div" data-status="N" data-sort="1002" style="display: none;">\
           <div class="res-row drag-res-row" style="height:37px !important">\
              <div class="operation manual-order-hide-part" style="float:left;!important">\
                 <ul style="margin-top:0px;">\
                 	<li id ="continuousPlayMode">开启视频连续播放模式（按钮在视频界面）</li>\
                 	<div class="clear"></div>\
                 </ul>\
              </div>\
           </div>\
        </div>\
      </div>\
    </div>\
</div>\
    <!-- helper area End -->\
    <div id="sourceTitle" style="padding:0 20px">\
       <div class="clear10"></div>\
       <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="100%" color=#0BD SIZE=4>\
       <div class="clear10"></div>\
       <div class="res-row-title">\
          <span style="color: #0BD;font-weight:600; font-size:16px"> 资源区 </span>\
       </div>\
    </div>\
      ').insertAfter("#res-view-way");
	// 初始化
	$("#module-1,#module-2").css("display", "none");
	$("#confirm, #downloadSrc, #mode-click, #mode-download").css("display", "inline");
	// change mode
	$(document).on('click', '#mode-click', function() {
		$("#module-1, #module-2").css("display", "block");
		//         等价于
		//         document.getElementById("module-1").style.display="block";
		//         document.getElementById("module-2").style.display="block";
		//         document.getElementById('confirm').style.display = document.getElementById('confirm').style.display=="inline"?"inline":"none";
		$("#downloadSrc, #mode-download").css("display", "none");
		//         $("#mode-click").css({"background-color":"#0BD","color":"#fff"});
		$("#modeName").text("模拟点击");
		if (browserType() == "Chrome") {
			newTabAlert("chrome://settings/downloads", 'active', function() {
				alert("操作提醒：\n" + "务必操作，否则请不要向下执行任何操作！！！\n" + "\n" +
					"（识别到您使用的是Chrome浏览器）" + "\n\n" +
					"   已自动为你打开浏览器【设置】页面" + "\n" +
					"   【提醒】：如果没有结果可在搜索框中搜索【保存位置】" + "\n" +
					" 【 打开 】 “下载前询问每个文件的保存位置” 右侧按钮");
			});
		} else {
			alert("操作提醒：\n" + "务必操作，否则请不要向下执行任何操作！！！\n" + "\n" +
				"（以下只是 chrome 浏览器操作步骤）" + "\n" +
				"  1. 新建 Tab 页\n" + "   -->\n" +
				"  2. 地址栏输入： chrome://settings/?search=downloads\n" + "   -->\n" +
				"  3. 打开 “下载前询问每个文件的保存位置” 右侧按钮");
		}
	});
	$(document).on('click', '#mode-download', function() {
		document.getElementById("module-1").style.display = "block";
		$("#module-2, #confirm, #mode-click").css("display", "none");
		//         $("#mode-download").css({"background-color":"#0BD","color":"#fff"});
		$("#modeName").text("批量下载");
		if (browserType() == "Chrome") {
			newTabAlert("chrome://settings/downloads", 'active', function() {
				alert("操作提醒：\n" + "务必操作，否则请不要向下执行任何操作！！！\n" + "\n" +
					"（识别到您使用的是Chrome浏览器）" + "\n\n" +
					"   已自动为你打开浏览器【设置】页面" + "\n" +
					"   【提醒】：如果没有结果可在搜索框中搜索【保存位置】" + "\n" +
					" 【 关闭 】 “下载前询问每个文件的保存位置” 右侧按钮")
			});
		} else {
			alert("操作提醒：\n" + "务必操作，否则请不要向下执行任何操作！！！\n" + "\n" +
				"（以下只是 chrome 浏览器操作步骤）" + "\n" +
				"  1. 新建 Tab 页\n" + "   -->\n" +
				"  2. 地址栏输入：chrome://settings/?search=downloads\n" + "   -->\n" +
				"  3. 关闭 “下载前询问每个文件的保存位置” 右侧按钮");
		}
	});
	$(document).on('click', '#reset', function() {
		$("#module-1,#module-2").css("display", "none");
		$("#confirm, #downloadSrc, #mode-click, #mode-download").css("display", "inline");
		//         $("#mode-download, #mode-click").css({"background-color":"#fff","color":"#000"});
		$("#modeName").text("未选择");

	});
	// 刷新
	$(document).on('click', '#refresh', function() {
		location.reload()
	})
	//资源栏总数
	var srcBarSum = 0;
	//   给分栏添加 id 易于按栏操作
	$(".res-row-box").each(function(i, e) {
		$(this).attr('id', 'id_' + i);
		srcBarSum = i + 1;
	});
	//存储所有被选择的资源栏 id
	var chosenIDs = [];
	$(document).on('click', '#choose', function() {
		//获取点击时按钮值
		var val = $("#choose").val();
		//接受用户输入的id 字符串
		let inputString = $("#bar_index").val().trim();
		//inputString经过清洗后得到的有效资源栏编号
		let idsArr = cleanData(inputString);

		if (val == "确认选择") {
			/**
			 * 用户修改要选择的资源栏点击确认后
			 * 根据有效资源栏编号生成对应资源栏id存入数组备用
			 * 并显示被选择的所有有效资源栏
			 */

			//无输入内容,选择全部栏
			if (idsArr.length == 0) {
				chosenIDs.push(".res-row-box");
			} else {
				//有输入内容，转化成对应的id,放入数组备用
				for (let id of idsArr) {
					chosenIDs.push("#id_" + (id - 1));
				}
			}
			//test
			// console.log(idsArr);
			//var barID = $("#bar_index").val();
			let barID_str = idsArr.length == 0 ? "全选" : idsArr;
			//var barID_str =  (barID > 0 && barID < 21) ? barID : "全选";
			alert("小可爱，你已将要操作的资源栏修改为： " + barID_str);
			$("#barID").text(barID_str);
			$("#choose").val("重置");
			$("#choose").css('background-color', 'rgba(204, 0, 0,0.6)');

		} else {
			/**
			 * 用户重置资源栏输入框
			 * 置空输入框 和 存储的所有资源栏id
			 * 被选择的资源栏设为全选
			 */
			$("#bar_index").val("");
			chosenIDs = [];
			$("#choose").val("确认选择");
			$("#choose").click();

		}

	});

	// reset  bar_index
	$('#bar_index').bind("input propertychange", function(event) {
		$("#choose").val("确认选择");
		$("#choose").css('background-color', 'rgba(0, 151, 179,0.7)');
	});


	/**
	 * Main body
	 *
	 */

	/**
	 * 根据指定的所有资源栏id，进行模拟点击
	 */
	$(document).on('click', '#confirm', function() {
		batchForMoreSrcBars("模拟点击", chosenIDs)
	});

	/**
	 * 根据指定的所有资源栏id，进行批量下载
	 *
	 */
	$(document).on('click', '#downloadSrc', function() {
		batchForMoreSrcBars("批量下载", chosenIDs)
	});

	/**
	 * 模拟正序点击全部资源
	 *
	 */
	$(document).on('click', '.forward', function() {
		clickAll("true")
	});

	/**
	 * 模拟倒序点击全部资源
	 *
	 */
	$(document).on('click', '.reverse', function() {
		clickAll("false")
	});


	$(document).on('click' , '#continuousPlayMode', ()=>{continuousPlay()} )


});