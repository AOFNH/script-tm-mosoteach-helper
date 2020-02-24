// ==UserScript==
// @name         云班课高效助手
// @namespace    http://tampermonkey.net/
// @version      1.31
// @description  添加下载按钮，可以按栏缩小范围进行模拟批量点击资源，批量下载资源，提高效率。【基于其他脚本修改（@name 蓝墨云班课（Moso Tech）资源下载；@author xfl03）。】【注意：执行完毕后需刷新页面】【只是出于个人原因开发，只做了chrome适配，其他浏览器可用，但具体操作会有一点不同】
// @author       bellamy.n.h
// @match        https://www.mosoteach.cn/web/index.php*
// @grant        none
// ==/UserScript==


/**
 * Log
 *
 * Version 1.31
 * 修复可能存在的Bug (页面无法自动关闭)
 * 
 */

$(function() {
    'use strict';

/**
 *  睡眠函数
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
*文件下载函数
*/
  function download(name, href) {
      var a = document.createElement("a"), //创建a标签
          e = document.createEvent("MouseEvents"); //创建鼠标事件对象
      e.initEvent("click", false, false); //初始化事件对象
      a.href = href; //设置下载地址
      a.download = name; //设置下载文件名
      a.dispatchEvent(e); //给指定的元素，执行事件click事件
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
  #choose{ background:rgba(0, 151, 179,0.7);}
  //#refresh{ background:rgba(0, 151, 179,0.7);}
</style>`;
    $(styleTag).appendTo('head');

//为每个资源添加下载按钮
    $(".res-row-open-enable").each(function() {
        if ($(this).find(".download-res-button").length > 0) return;//如果已经存在下载按钮（例如mp3），则不再添加
        $(this).find("ul").html('<li class="download-ress download-res-button">下载</li>' + $(this).find("ul").html());
//         $(this).find("ul").html('<li class="forward">正序点击</li>' + $(this).find("ul").html());
//         $(this).find("ul").html('<li class="reverse">倒序点击</li>' + $(this).find("ul").html());
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
              <span ><a href="https://greasyfork.org/zh-CN/scripts/390978-%E4%BA%91%E7%8F%AD%E8%AF%BE%E9%AB%98%E6%95%88%E5%8A%A9%E6%89%8B">云班课高效助手</a></span>\
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
           <span style="color: #0BD" >(范围：1 至 20；不在 [1,20] 该区间内 / 不填写 则视为全选)</span>\
           <span style="color: red">(注意：资源栏号是从资源区里第一栏开始)</span>\
           <i class="icon-angle-down slidedown-button manual-order-hide-part" data-sort="1000"></i>\
        </div>\
        <div class="hide-div" data-status="N" data-sort="1000" style="display: none;">\
          <form class="appendTxt res-row" style="padding:20px 20px 0px 20px ; !important">\
              <input id="bar_index" placeholder="输入要点击的栏号（从 1 开始）" style="border:1px solid #0BD; border-radius:8px;width:20%">&nbsp\
              <input id="choose" class="helper-btn helper-btn-a"  type="button" value="确认选择">\
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
              <input id="head" class="indexNum" placeholder="起始位置(从“1”开始)" style="border:1px solid #0BD; border-radius:8px;width:20%">&nbsp\
              <input id="tail" class="indexNum" placeholder="结束位置" style="border:1px solid #0BD; border-radius:8px;width:20%">&nbsp\
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
//     初始化
    $("#module-1,#module-2").css("display","none");
    $("#confirm, #downloadSrc, #mode-click, #mode-download").css("display","inline");
// change mode
    $(document).on('click','#mode-click',function(){
        $("#module-1, #module-2").css("display","block");
//         等价于
//         document.getElementById("module-1").style.display="block";
//         document.getElementById("module-2").style.display="block";
//         document.getElementById('confirm').style.display = document.getElementById('confirm').style.display=="inline"?"inline":"none";
        $("#downloadSrc, #mode-download").css("display","none");
//         $("#mode-click").css({"background-color":"#0BD","color":"#fff"});
        $("#modeName").text("模拟点击");
        alert("操作提醒：\n"+"务必操作，否则请不要向下执行任何操作！！！\n" + "\n" + "（以下只是 chrome 浏览器操作步骤）" + "\n" + "  1. 新建 Tab 页\n"+"   -->\n"+"  2. 地址栏输入： chrome://settings/?search=downloads\n" +"   -->\n" + "  3. 打开 “下载前询问每个文件的保存位置” 右侧按钮");
    });
    $(document).on('click','#mode-download',function(){
        document.getElementById("module-1").style.display="block";
        $("#module-2, #confirm, #mode-click").css("display","none");
//         $("#mode-download").css({"background-color":"#0BD","color":"#fff"});
        $("#modeName").text("批量下载");
        alert("操作提醒：\n"+"务必操作，否则请不要向下执行任何操作！！！\n" + "\n" + "（以下只是 chrome 浏览器操作步骤）" + "\n" + "  1. 新建 Tab 页\n"+"   -->\n"+"  2. 地址栏输入：chrome://settings/?search=downloads\n" +"   -->\n" + "  3. 关闭 “下载前询问每个文件的保存位置” 右侧按钮");
    });
    $(document).on('click','#reset',function(){
        $("#module-1,#module-2").css("display","none");
        $("#confirm, #downloadSrc, #mode-click, #mode-download").css("display","inline");
//         $("#mode-download, #mode-click").css({"background-color":"#fff","color":"#000"});
        $("#modeName").text("未选择");

    });
// 刷新
    $(document).on('click','#refresh',function(){location.reload()})
//   给分栏添加 id 易于按栏操作
    $(".res-row-box").each(function(i,e){$(this).attr('id','id_' + i)});
    var chosenID = ".res-row-box";
    $(document).on('click','#choose',function(){

        switch($("#bar_index").val()){
            case "1":chosenID = "#id_0";break;
            case "2":chosenID = "#id_1";break;
            case "3":chosenID = "#id_2";break;
            case "4":chosenID = "#id_3";break;
            case "5":chosenID = "#id_4";break;
            case "6":chosenID = "#id_5";break;
            case "7":chosenID = "#id_6";break;
            case "8":chosenID = "#id_7";break;
            case "9":chosenID = "#id_8";break;
            case "10":chosenID = "#id_9";break;
            case "11":chosenID = "#id_10";break;
            case "12":chosenID = "#id_11";break;
            case "13":chosenID = "#id_12";break;
            case "14":chosenID = "#id_13";break;
            case "15":chosenID = "#id_14";break;
            case "16":chosenID = "#id_15";break;
            case "17":chosenID = "#id_16";break;
            case "18":chosenID = "#id_17";break;
            case "19":chosenID = "#id_18";break;
            case "20":chosenID = "#id_19";break;
            default:chosenID = ".res-row-box";
        }
        var barID = $("#bar_index").val();
        var barID_str =  (barID > 0 && barID < 21) ? barID : "全选";
        alert("小可爱，你已将要操作的资源栏修改为： "+ barID_str);
        $("#barID").text(barID_str);

        console.log(chosenID  + "映射值 <-- 输入值" + $("#bar_index").val());
    })


/**
 * Main body
 * 
 */

    // Refresh page tips function
    function refreshPage(){
        alert("操作完成，请小可爱刷新页面查看结果！！！");
    }
    

/**
 * 指定下标区间，进行模拟点击（用于资源量较大,有漏掉的情况）
 * 
 */

    $(document).on('click', '#confirm', function() {

        var conf_str = false;
        conf_str = confirm("小可爱，你即将执行“模拟点击”操作！！！"  + "\n\n"+"根据选择资源数量的不同，会打开相应数量的页面，如果数量较多，请不要惊慌，因为这些页面会自动关闭的哦！！！"+ "\n\n" + "你是否按照上一个提示，进行了相应的操作？" + "\n\n" + "如果是，你是否要开始执行本次操作？");
       if(conf_str){
       //         以下五个等价，实现相同功能，但写法是逐步优化
//         var list = document.getElementsByClassName("res-row-open-enable");
//         var list = $(".res-row-open-enable");
//         var list = $(".hide-div").children();
//         var list = $(".res-row-box").children(".hide-div").children();
        var list = $(chosenID).children(".hide-div").children();
        var succNum = 0;
        var failNum = 0;
        var tempUrl;
        var win;
        var startIndex = $("#head").val();
        var endIndex = $("#tail").val();
        var actualStartIndex = startIndex < list.length ? startIndex : list.length;//输入值超出资源总数的值，则将输入值置为总数的值
        var actualEndIndex = endIndex < list.length ? endIndex : list.length;//输入值超出资源总数的值，则将输入值置为总数的值
        for (var i = actualStartIndex-1; i < actualEndIndex; i++){
            try{
                try{
                    tempUrl = list[i].getAttribute("data-href");
                }catch(e){
                    console.log(e.name + ": " + e.message );
                    alert("输入的资源栏数不在该页资源栏数的范围内，无法执行，请重新选择资源栏");
                    break;
                }
                win = window.open(tempUrl);
                sleep(100);//睡眠，是为了确保每个资源都被正常获取
                win.close();
                succNum++;
                console.log(tempUrl);
            }catch(e){
                console.log(e.name + ": " + e.message );
                console.log("该条未成功执行 ；URL :   "+ list[i].getAttribute("data-href"));
                failNum++;
                continue;
            }
        }
//         location.reload();
        console.log("共检索到 "+ list.length + "条； 成功执行 " + succNum + " 次！ 失败 " + failNum + " 次！ 操作范围：从第 " + actualStartIndex + " 条 至 第 " + actualEndIndex +" 条。");
        $(".indexNum").val("");
        /**
         * For CRX
         */
        setTimeout(refreshPage,0);
       }else{
           alert("已取消操作！");
       }




    });


/**
 * 模拟正序点击全部资源
 * 
 */
    $(document).on('click', '.forward', function() {
        var conf_str = false;
        conf_str = confirm("小可爱，你即将执行“正序点击全部资源”操作，如果资源量较大（> 1000），耗时就会较久，打开的页面也会较多哦！不过都会自动关闭的哦！！！" + "\n\n" + "小可爱，资源较多时，还请三思啊！！！" + "\n\n" + "你是否要执行？");
       if(conf_str){

        var list = document.getElementsByClassName("res-row-open-enable");
        var succNum = 0;
        var failNum = 0;
        var tempUrl;
        var win;
        for (var i = 0; i < list.length; i++){
            try{
                tempUrl = list[i].getAttribute("data-href");
                win = window.open(tempUrl);
                sleep(100);//睡眠，是为了确保每个资源都被正常获取
                win.close();
                succNum++;
                console.log(tempUrl);
            }catch(e){
                console.log(e.name + ": " + e.message );
                console.log("该条未成功执行 ；URL :   "+ list[i].getAttribute("data-href"));
                failNum++;
                continue;
            }
        }
        console.log("正序点击： 共检索到 "+ list.length + "条； 成功执行 " + succNum + " 次！ 失败 " + failNum + " 次！" );
        setTimeout(refreshPage,0);
       }else{
       alert("已取消操作！");
       }
    });


/**
 * 模拟倒序点击全部资源
 * 
 */

    $(document).on('click', '.reverse', function() {
                var conf_str = false;
        conf_str = confirm("小可爱，你即将执行“倒序点击全部资源”操作，如果资源量较大（> 1000），耗时就会较久，打开的页面也会较多哦！不过都会自动关闭的哦！！！" + "\n\n" + "小可爱，资源较多时，还请三思啊！！！" + "\n\n" + "你是否要执行？");
       if(conf_str){
        var list = document.getElementsByClassName("res-row-open-enable");
        var succNum = 0;
        var failNum = 0;
        var tempUrl;
        var win;
        for (var i = list.length - 1; i >= 0; i--){
            try{
                tempUrl = list[i].getAttribute("data-href");
                win = window.open(tempUrl);
                sleep(100);//睡眠，是为了确保每个资源都被正常获取
                win.close();
                succNum++;
                console.log(tempUrl);
            }catch(e){
                console.log(e.name + ": " + e.message );
                console.log("该条未成功执行 ；URL :   "+ list[i].getAttribute("data-href"));
                failNum++;
                continue;
            }
        }
        console.log("倒序点击：  共检索到 "+ list.length + "条； 成功执行 " + succNum + " 次！ 失败 " + failNum + " 次！" );
        setTimeout(refreshPage,0);
       }else{
       alert("已取消操作！");
       }
    });


/**
 * 指定下标区间，进行批量下载
 * 
 */
    $(document).on('click', '#downloadSrc', function() {

        var conf_str = false;
        conf_str = confirm("小可爱，你即将执行“批量下载”操作！！！"+"\n\n"+"根据选择资源数量的不同，会打开相应数量的页面，如果数量较多，请不要惊慌，因为这些页面会自动关闭的哦！！！" + "\n\n" + "你是否按照上一个提示，进行了相应的操作？" + "\n\n" + "如果是，你是否要开始执行本次操作？");
       if(conf_str){
//         var list = document.getElementsByClassName("res-row-open-enable");
        var list = $(chosenID).children(".hide-div").children();
        var succNum = 0;
        var failNum = 0;
        var tempUrl;
        var win;
        var startIndex = $("#head").val();
        var endIndex = $("#tail").val();
        var actualStartIndex = startIndex < list.length ? startIndex : list.length;//输入值超出资源总数的值，则将输入值置为总数的值
        var actualEndIndex = endIndex < list.length ? endIndex : list.length;//输入值超出资源总数的值，则将输入值置为总数的值
        for (var i = actualStartIndex-1; i < actualEndIndex; i++){
            try{
                try{
                    tempUrl = list[i].getAttribute("data-href");
                }catch(e){
                    console.log(e.name + ": " + e.message );
                    alert("输入的资源栏数不在该页资源栏数的范围内，无法执行，请重新选择资源栏");
                    break;
                }
//              download('第' + i+1 + '个文件', tempUrl);
                win = window.open(tempUrl);
                succNum++;
                console.log(tempUrl);
            }catch(e){
                console.log(e.name + ": " + e.message );
                console.log("该条未成功执行 ；URL :   "+ list[i].getAttribute("data-href"));
                failNum++;
                continue;
            }
        }
        console.log("共检索到 "+ list.length + "条； 成功执行 " + succNum + " 次！ 失败 " + failNum + " 次！ 操作范围：从第 " + actualStartIndex + " 条 至 第 " + actualEndIndex +" 条。");
        $(".indexNum").val("");
        setTimeout(refreshPage,0);
       }else{
       alert("已取消操作！");
       }
    });


});