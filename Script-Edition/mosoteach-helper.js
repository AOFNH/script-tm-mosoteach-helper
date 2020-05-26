// ==UserScript==
// @name         云班课高效助手
// @author       bellamy.n.h
// @namespace    http://tampermonkey.net/
// @version      1.65
// @description  【🎇视频相关功能来啦😊  新增 “视频连播” 、 “即刻看完” 】  单个下载资源，批量下载资源，选择多栏资源进行批量处理，助你高效使用云班课。
// @match        https://www.mosoteach.cn/web/index.pjhp*
// @include      *://www.mosoteach.cn/web/index.php*
// @note         Version 1.65    偷偷改了些小Bug 🤭，使连播更顺畅。下个版本上16倍速连播喽😊
// @note         Version 1.60    新增测试功能，支持 连续播放所有视频、 立即看完当前视频（测试阶段，还请反馈）
// @note         Version 1.50    加强对输入值约束； 支持多栏处理； chrome浏览器自动打开 设置页面地址更改； 其他Bug修复。
// @note         Version 1.40    优化代码；  新增浏览器类型判断，支持chrome浏览器自动打开 设置页面。
// @note         Version 1.32    优化操作反馈 （可以重置已选择的资源栏数）
// @note         Version 1.31    修复可能存在的Bug (页面无法自动关闭)
// @icon         https://s1.ax1x.com/2020/05/18/Yf6Kcd.png
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==


$(function() {
    'use strict';

    var setVal = GM_setValue;// GM_setValue(name, value)
    var getVal = GM_getValue;// GM_getValue(name, defaultValue)
    var notification = GM_notification;// GM_notification(text, title, image, onclick)
    var delVal = GM_deleteValue;// GM_deleteValue(name)
    var listVals = GM_listValues;// GM_listValues()

    var config = {
        notificationTitle : "云班课高效助手",
        icon128: "https://s1.ax1x.com/2020/05/18/Yf6pp4.png",
        icon48: "https://s1.ax1x.com/2020/05/18/Yf6Kcd.png",
        icon32: "https://s1.ax1x.com/2020/05/18/Yf6BBq.png",
        icon16: 'https://s1.ax1x.com/2020/05/18/Yfg71e.png',
    };

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

    var rt1 = [];
    var S2 = 0;
    var nOvm3;
    var JwbFu4;
    var nBRTbru5 = 3000;
    var hqvH6 = false;
    var VfJKMDBo7 = 1;
    var YQsMGhZ8 = 1000 / VfJKMDBo7;
    var lV$fAhb9 = 0;
    var deT$F10 = 1;
    var GOrpb11 = '';

    function continuousPlay() {
        hqvH6 = true;
        if (typeof($("\x23\x63\x6f\x6e\x74\x69\x6e\x75\x6f\x75\x73\x50\x6c\x61\x79")["\x61\x74\x74\x72"]("\x63\x6c\x61\x73\x73")) != "\x75\x6e\x64\x65\x66\x69\x6e\x65\x64") {
            let text = "\u8fde\u7eed\u64ad\u653e\u5df2\u5f00\u542f\x2c\u65e0\u9700\u91cd\u590d\u5f00\u542f";
            window["\x61\x6c\x65\x72\x74"](text);
            return;
        }
        $('<div id = "continuousPlay" class="mejs__button">\
<button type="button" aria-controls="mep_0" title="开始连续播放" aria-label="Play" tabindex="0"></button>\
</div>\
<div id = "stopContinuousPlay" class="mejs__button mejs__playpause-button mejs__pause">\
<button type="button" aria-controls="mep_0" title="暂停连续播放" aria-label="Pause" tabindex="0"></button>\
</div>').insertAfter(".mejs__fullscreen-button");
        $("\x23\x63\x6f\x6e\x74\x69\x6e\x75\x6f\x75\x73\x50\x6c\x61\x79")["\x63\x6c\x69\x63\x6b"](() => {
            hqvH6 = true;
            clickDiv();
        });
        $("\x23\x73\x74\x6f\x70\x43\x6f\x6e\x74\x69\x6e\x75\x6f\x75\x73\x50\x6c\x61\x79")["\x63\x6c\x69\x63\x6b"](() => {
            hqvH6 = false;
            clearInterval(nOvm3);
            clearTimeout(JwbFu4);
            let stopContinusPlayText = "\u5df2\u9000\u51fa\u8fde\u7eed\u64ad\u653e\u6a21\u5f0f\uff0c\u4f46\u4fdd\u7559\u4e86\u5173\u95ed\u89c6\u9891\u5373\u53ef\u770b\u5b8c\u529f\u80fd\x3b\n\u4e0b\u4e00\u6b21\u8fde\u7eed\u64ad\u653e\u4ece\u7b2c " + (deT$F10 + 1) + " \u4e2a\u89c6\u9891\u5f00\u59cb\u3002";
            window["\x61\x6c\x65\x72\x74"](stopContinusPlayText);
        });
        window["\x61\x6c\x65\x72\x74"]("\u8fde\u7eed\u64ad\u653e\u5df2\u5f00\u542f\uff0c\u8bf7\u5230\u89c6\u9891\u9875\u9762\u4f7f\u7528");
    }
    let a = $("\x64\x69\x76\x5b\x64\x61\x74\x61\x2d\x6d\x69\x6d\x65\x3d\x27\x76\x69\x64\x65\x6f\x27\x5d");
    window["\x4f\x62\x6a\x65\x63\x74"]["\x6b\x65\x79\x73"](a)["\x66\x6f\x72\x45\x61\x63\x68"]((key) => {
        rt1["\x70\x75\x73\x68"](a[key]);
    });
    console["\x6c\x6f\x67"](rt1["\x6c\x65\x6e\x67\x74\x68"]);
    for (let a in rt1) {
        console["\x6c\x6f\x67"](a);
    }

    function send() {
        console["\x6c\x6f\x67"]("\x73\x65\x6e\x64 \x73\x74\x61\x72\x74");
        console["\x6c\x6f\x67"]("\u5173\u95ed\u5373\u770b\u5b8c");
        $["\x61\x6a\x61\x78\x53\x65\x74\x75\x70"]({
            beforeSend: function() {
                let argsData = arguments[1]["\x64\x61\x74\x61"]
                let falseArgsData = "";
                let falseVal;
                for (let k in argsData) {
                    if (k["\x69\x6e\x63\x6c\x75\x64\x65\x73"]("\x77\x61\x74\x63\x68\x5f\x74\x6f")) {
                        console["\x6c\x6f\x67"]("\x62\x65\x66\x6f\x72\x65\x3a " + k + " \x3a " + argsData[k]);
                        falseVal = argsData["\x64\x75\x72\x61\x74\x69\x6f\x6e"];
                        console["\x6c\x6f\x67"]("\x61\x66\x74\x65\x72\x3a " + k + " \x3a " + falseVal);
                    } else {
                        falseVal = argsData[k];
                    }
                    falseArgsData = falseArgsData + "\x26" + k + "\x3d" + falseVal;
                }
                arguments[1]["\x64\x61\x74\x61"] = falseArgsData["\x73\x75\x62\x73\x74\x72\x69\x6e\x67"](1, falseArgsData["\x6c\x65\x6e\x67\x74\x68"]);
            },
            processData: false,
            complete: function() {
                console["\x6c\x6f\x67"]("\x73\x65\x6e\x64 \x63\x6f\x6d\x70\x6c\x65\x74\x65\x64");
            }
        });
    }

    function clickDiv() {
        lV$fAhb9 = S2++;
        deT$F10 = lV$fAhb9 + 1;
        if (hqvH6 == false) {
            console["\x6c\x6f\x67"]("\u5728\u64ad\u653e\u7b2c " + (deT$F10) + " \u4e2a\u89c6\u9891\u65f6\u9000\u51fa\u4e86\u8fde\u7eed\u64ad\u653e");
            return;
        }
        if (lV$fAhb9 == 0) {
            send();
            let text = "\u8fde\u7eed\u64ad\u653e\u5df2\u5f00\u59cb\uff01\n\u5171\u8981\u64ad\u653e " + rt1["\x6c\x65\x6e\x67\x74\x68"] + " \u4e2a\u89c6\u9891\n\u672a\u81ea\u52a8\u64ad\u653e\u7684\u89c6\u9891\u9700\u8981\u624b\u52a8\u70b9\u51fb\u64ad\u653e\n\u4e0b\u4e2a\u7248\u672c\u589e\u52a0\u81ea\u52a8\u64ad\u653e";
            window["\x61\x6c\x65\x72\x74"](text);
        }
        if (lV$fAhb9 < rt1["\x6c\x65\x6e\x67\x74\x68"]) {
            $(rt1[lV$fAhb9])["\x74\x72\x69\x67\x67\x65\x72"]("\x63\x6c\x69\x63\x6b");
            playThisVideo();
        } else {
            setTimeout(() => {
                clearInterval(nOvm3);
            }, 0);
            console["\x6c\x6f\x67"]("\u7ed3\u675f");
            $("\x2e\x63\x6c\x6f\x73\x65\x2d\x77\x69\x6e\x64\x6f\x77")["\x74\x72\x69\x67\x67\x65\x72"]("\x63\x6c\x69\x63\x6b");
            window["\x61\x6c\x65\x72\x74"]("\u8fde\u7eed\u64ad\u653e\u7ed3\u675f\uff0c \u5171\u8fde\u7eed\u64ad\u653e\u4e86 " + rt1["\x6c\x65\x6e\x67\x74\x68"] + " \u4e2a\u89c6\u9891\uff0c\u5373\u5c06\u5237\u65b0\u9875\u9762");
            location["\x72\x65\x6c\x6f\x61\x64"]();
        }
    }

    function playThisVideo() {
        if (lV$fAhb9 >= rt1["\x6c\x65\x6e\x67\x74\x68"]) {
            return;
        }
        setTimeout(() => {
            let video = window["\x64\x6f\x63\x75\x6d\x65\x6e\x74"]["\x71\x75\x65\x72\x79\x53\x65\x6c\x65\x63\x74\x6f\x72"]('\x76\x69\x64\x65\x6f');
            let duration = video["\x64\x75\x72\x61\x74\x69\x6f\x6e"];
            let currentTime = video["\x63\x75\x72\x72\x65\x6e\x74\x54\x69\x6d\x65"];
            let remain = (duration - currentTime) * YQsMGhZ8;
            console["\x6c\x6f\x67"]("\u8be5\u89c6\u9891\u5269\u4f59\u64ad\u653e\u65f6\u957f \uff1a" + remain + " \u6beb\u79d2");
            clearInterval(nOvm3);
            clearTimeout(JwbFu4);
            nOvm3 = setInterval(clickDiv, remain + nBRTbru5);
            JwbFu4 = setTimeout(() => {
                console["\x6c\x6f\x67"]("\u5f53\u524d\u89c6\u9891\u64ad\u653e\u5230\uff1a" + window["\x64\x6f\x63\x75\x6d\x65\x6e\x74"]["\x71\x75\x65\x72\x79\x53\x65\x6c\x65\x63\x74\x6f\x72"]('\x76\x69\x64\x65\x6f')["\x63\x75\x72\x72\x65\x6e\x74\x54\x69\x6d\x65"]);
                $("\x2e\x63\x6c\x6f\x73\x65\x2d\x77\x69\x6e\x64\x6f\x77")["\x74\x72\x69\x67\x67\x65\x72"]("\x63\x6c\x69\x63\x6b");
                console["\x6c\x6f\x67"]("\u5173\u95ed\u7b2c" + deT$F10 + "\u4e2a\u89c6\u9891");
                console["\x6c\x6f\x67"](nBRTbru5 + " \u6beb\u79d2\u540e\u64ad\u653e\u4e0b\u4e00\u4e2a\u89c6\u9891");
            }, remain);
        }, 10000);
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