var Stage = Laya.Stage;	//new Stage() 非stage prop
var Text  = Laya.Text;	
var WebGL = Laya.WebGL;
var Loader  = Laya.Loader;
var Texture = Laya.Texture;
var Handler = Laya.Handler;
var Sprite = Laya.Sprite;
var Slider = Laya.Slider;
var Browser = Laya.Browser;
var Tween   = Laya.Tween;
var List    = Laya.List;
var Browser = laya.utils.Browser;
var Event   = Laya.Event;
var Rectangle = Laya.Rectangle;
var HSlider = Laya.HSlider;
var VSlider = Laya.VSlider;
var Handler = Laya.Handler;
var List    = Laya.List;
var Img = Laya.Image;
var Button  = Laya.Button;
var Animation = Laya.Animation;
var Box   = Laya.Box;
var ColorFilter = Laya.ColorFilter;
var LayaCanvas = Laya.HTMLCanvas;
var TextInput = Laya.TextInput;

const DesignProp = {
    width:750,
    height:1450,
    background:'#00CCFF',
}

//英雄代码
/*
//特殊能力↓
gM 梅林
gP 派西维尔
bN 莫甘娜
bA 刺客
bO 奥伯伦
bK 莫德雷德
//无特殊能力↓
gz 亚瑟的忠臣
bm 莫德雷德的爪牙 
*/

var GameProp = 
{
	getPlayerTeam:function(num)
	{
		switch (num) {
			case 5:
				return ['gM','gP','gz','bN','bA'];
			case 6:
				return ['gM','gP','gz','gz','bN','bA'];
			case 7:
				return ['gM','gP','gz','gz','bN','bA','bO'];				
			case 8:
				return ['gM','gP','gz','gz','gz','bN','bA','bm'];
			case 9:
				return ['gM','gP','gz','gz','gz','gz','bN','bA','bK'];
			case 10:
				return ['gM','gP','gz','gz','gz','gz','bN','bA','bK','bO'];
			default:
				return null;
		}
	}
}

function findSpriteByName(frame,name)
{
	for (var i = 0; i < frame.staticSprite.length; i++) {
		if (frame.staticSprite[i].SpriteName == name) {
			return frame.staticSprite[i].SpriteBase;
		}
	}
	return false
}

function defaultCreateSprite(frame)
{
	for (var i = 0; i < frame.staticSprite.length; i++) {
		frame.staticSprite[i].init?frame.staticSprite[i].init():'';
		var t = Laya.loader.getRes(frame.staticSprite[i].url);
		frame.staticSprite[i].SpriteBase = new Sprite();
		frame.staticSprite[i].SpriteBase.graphics.drawTexture(t,0,0);
		frame.ctn.addChild(frame.staticSprite[i].SpriteBase);
		
		frame.staticSprite[i].SpriteBase.x = frame.staticSprite[i].x;	
		frame.staticSprite[i].SpriteBase.y = frame.staticSprite[i].y;

		!isNaN(frame.staticSprite[i].alpha)?frame.staticSprite[i].SpriteBase.alpha = frame.staticSprite[i].alpha:'';
			
		frame.staticSprite[i].pivot?frame.staticSprite[i].SpriteBase.pivot(frame.staticSprite[i].pivot[0],frame.staticSprite[i].pivot[1]):'';
		frame.staticSprite[i].scalex?frame.staticSprite[i].SpriteBase.scaleX = frame.staticSprite[i].scalex:'';
		frame.staticSprite[i].scaley?frame.staticSprite[i].SpriteBase.scaleY = frame.staticSprite[i].scaley:'';

        frame.staticSprite[i].TweenFrom?Tween.from(frame.staticSprite[i].SpriteBase,frame.staticSprite[i].TweenFrom,300):'';

		frame.staticSprite[i].SpriteBase.on(Event.REMOVED,this,function(event){
			
		})
		frame.staticSprite[i].SpriteBase.size(Laya.loader.getRes(frame.staticSprite[i].url).width,Laya.loader.getRes(frame.staticSprite[i].url).height)
		frame.staticSprite[i].onClick?frame.staticSprite[i].SpriteBase.on(Event.CLICK, this, frame.staticSprite[i].onClick):'';
	}
	Laya.stage.addChild(frame.ctn);
}



var CustomLoader = {
	AssetList:[
		'./custom_assets/Logo.png',
		'./custom_assets/Hero/Hero_gM.png',
		'./custom_assets/Hero/Hero_gP.png',
		'./custom_assets/Hero/Hero_bN.png',
		'./custom_assets/Hero/Hero_bA.png',
		'./custom_assets/Hero/Hero_bO.png',
		'./custom_assets/Hero/Hero_bK.png',
		'./custom_assets/Hero/Hero_gz.png',
		'./custom_assets/Hero/Hero_bm.png',
		'./custom_assets/startgamebtn.png',
		'./custom_assets/getHeroBtn.png',
		'./custom_assets/nightmsg.png',
		'./custom_assets/1.png',
		'./custom_assets/2.png',
		'./custom_assets/3.png',
		'./custom_assets/4.png',
		'./custom_assets/5.png',
		'./custom_assets/6.png',
		'./custom_assets/7.png',
		'./custom_assets/8.png',
		'./custom_assets/9.png',
		'./custom_assets/10.png',
		'./custom_assets/round1.png',
		'./custom_assets/round2.png',
		'./custom_assets/round3.png',
		'./custom_assets/round4.png',
		'./custom_assets/round5.png',
		'./custom_assets/mission_scuess.png',
		'./custom_assets/mission_fail.png',

		'./custom_assets/successVote.png',
		'./custom_assets/failVote.png',		

		'./custom_assets/VoteTips.png',

		'./custom_assets/waitTips.png',
		
		

		'./custom_assets/Uknownothing.png',

		
		"./assets/comp/hslider.png", "./assets/comp/hslider$bar.png",
		"./assets/comp/vslider.png", "./assets/comp/vslider$bar.png",
		
	],
	loaderCtn:null,
	progressSp:null,
	progressTx:null,
	loader:function()
	{
		CustomLoader.loaderCtn = new Sprite();		//创建容器

		CustomLoader.progressSp = new Sprite();		//创建进度条
		CustomLoader.progressTx = new Text();		//创建文字

		CustomLoader.loaderCtn.addChild(CustomLoader.progressSp)
		CustomLoader.loaderCtn.addChild(CustomLoader.progressTx)

		

		CustomLoader.progressTx.text = "0%";
		CustomLoader.progressTx.color = "#ffffff";
		CustomLoader.progressTx.font = "Impact";
		CustomLoader.progressTx.fontSize = 50;

		CustomLoader.progressTx.x = Laya.stage.width - CustomLoader.progressTx.width >> 1;	// ">>"  牛逼
		CustomLoader.progressTx.y = (Laya.stage.height - CustomLoader.progressTx.height >> 1)+90;
        CustomLoader.progressTx.pos(Laya.stage.width/2,Laya.stage.height/2  + 200);
        CustomLoader.progressTx.pivot(CustomLoader.progressTx.width/2,CustomLoader.progressTx.height/2);
		

        Laya.stage.addChild(CustomLoader.loaderCtn);
		
		
		CustomLoader.progressSp.graphics.drawRect(50, Laya.stage.height/2, 0, 50, "#333");

		Laya.loader.retryNum = 0;
		Laya.loader.load(CustomLoader.AssetList, Handler.create(this, CustomLoader.onAssetLoaded), Handler.create(this, CustomLoader.onLoading, null, false), Loader.IMAGE);

		// 侦听加载失败
		Laya.loader.on(Event.ERROR, this, CustomLoader.onError);
	},
	onAssetLoaded:function()
	{	
		console.log(Laya.loader)
		setTimeout(function(){
			Tween.to(CustomLoader.loaderCtn,
			{
				alpha:0,
			},300,null,Handler.create(this,function()
			{
				Laya.stage.removeChild(CustomLoader.loaderCtn);
                welcomeFrame.init();
			}))		
		},1000)
		
	},
	onLoading:function(progress)
	{
		CustomLoader.progressSp.graphics.clear();
		CustomLoader.progressSp.graphics.drawRect(50, Laya.stage.height/2, progress*(Laya.stage.width-100), 50, "#333");		
		
		CustomLoader.progressTx.text = (parseInt(progress*100))+'%';
	},
	onError:function(err)
	{
		console.log("加载失败: " + err);
	}
}

var welcomeFrame = 
{
    ctn:null,
    staticSprite:[
		{
			init:function(){
				this.pivot = [Laya.loader.getRes(this.url).width/2,Laya.loader.getRes(this.url).height/2],
				this.x = Laya.stage.width>> 1;
				this.y = Laya.stage.height>> 1;
			},
			SpriteName:'Logo',
			SpriteBase:null,
			url:'./custom_assets/Logo.png',
			x:0,
			y:0,
			pivot:[0,0],
            TweenFrom:{
                scaleX:10,
                scaleY:10,
                alpha:0,
            }
		},
    ],
    init:function()
    {
        this.ctn = new Sprite();
        
        defaultCreateSprite(welcomeFrame);

		setTimeout(function() {
			var Logo = findSpriteByName(welcomeFrame,'Logo');
			Logo?Tween.to(Logo,{alpha:0},300,null,Handler.create(this,function()
			{
				setPlayerFrame.init(true);	
			})):'';
		}, 1000);
    }
}

var setPlayerFrame = 
{
	ctn:null,
	_playerNum:5,
	playerNum:null,
	HeroLab:null,
	init:function()
    {
        //初始化容器
		this.ctn = new Sprite();
		Laya.stage.addChild(this.ctn);




		this.SlideNum();
		
		this.createHeroLab();

		this.createStartButton();
		//

	},
	SlideNum:function()
	{
		//横向滑块 选择人数
		var hs = new HSlider();
		hs.skin = "./assets/comp/hslider.png";
		hs.bar.skin = "./assets/comp/hslider$bar.png";
		hs.autoSize = true;
		
		hs.width = Laya.stage.width-100;
		hs.pos(50, Laya.stage.height/2 - 600);
		hs.min = 5;
		hs.max = 10;
		hs.value = 5;
		hs.showLabel = false;
		console.log(hs)
		hs.tick = 1;

		this._playerNum = 5;

		hs.changeHandler = new Handler(this, function(value){
			this._playerNum = value;
			this.playerNum.text = value + '人';
			this.createHeroLab();
		});
		this.ctn.addChild(hs);

		//初始化人数显示
		this.playerNum = new Text();
		this.playerNum.text = this._playerNum + '人';
		this.playerNum.color = "#333333";
		this.playerNum.font = "Impact";
		this.playerNum.fontSize = 50;
		this.playerNum.pivot(this.playerNum.width/2,this.playerNum.height/2);
		this.playerNum.pos(hs.width/2,hs.height/2 + 50);

		hs.addChild(this.playerNum);
	},
	createHeroLab:function()
	{
		this.HeroLab?this.HeroLab.destroy():'';
		this.HeroLab = new Sprite();
		this.HeroLab.autoSize = true;
		this.HeroLab.width = Laya.stage.width;
		this.HeroLab.pivot(Laya.stage.width/2,this.HeroLab.height/2);
		this.HeroLab.pos(Laya.stage.width/2,Laya.stage.height/2 - 400);

		var teamArray = GameProp.getPlayerTeam(this._playerNum);
		var row = 0;
		for (var i = 0; i < teamArray.length; i++) {
			var Hero = new Sprite();
			var Hero_t = Loader.getRes('./custom_assets/Hero/Hero_'+teamArray[i]+'.png');
			Hero_t.width=130;
			Hero_t.height= 165;
			Hero.pos(i%3 * Hero_t.width + (Laya.stage.width-3*Hero_t.width)/3 * (i%3) +((Laya.stage.width-3*Hero_t.width)/3)/2,parseInt(i/3) * Hero_t.height + parseInt(i/3)*5);
			

			Hero.graphics.drawTexture(Hero_t,0,0);
			this.HeroLab.addChild(Hero);
		}
	

		this.ctn.addChild(this.HeroLab);
	},
	createStartButton:function()
	{
		var StartBtn = new Sprite();
		var StartBtn_t = Loader.getRes('./custom_assets/startgamebtn.png');

		StartBtn.graphics.drawTexture(StartBtn_t,0,0);

		StartBtn.pivot(StartBtn_t.width/2,StartBtn_t.height);
		StartBtn.size(StartBtn_t.width,StartBtn_t.height);

		StartBtn.pos(Laya.stage.width/2,Laya.stage.height -30);

		StartBtn.on(Event.CLICK,this,function()
		{
			
			setPlayerFrame.ctn.destroy();
			getHeroframe.init();
		})

		this.ctn.addChild(StartBtn);
	}
}

var getHeroframe = 
{
	ctn:null,
	playerIdentity:[],		
	getHerostep:0,
	init:function()
	{
		this.ctn = new Sprite();
		this.playerIdentity = GameProp.getPlayerTeam(setPlayerFrame._playerNum).shuffle();
		Laya.stage.addChild(this.ctn);

		this.changePlayer();
	},
	changePlayer:function()
	{
		var RandomTips = new Text();
		RandomTips.color = "#333333";
		RandomTips.font = "Impact";
		RandomTips.fontSize = 50;
		RandomTips.text = '分配身份中...';
		RandomTips.pos(Laya.stage.width - RandomTips.width>>1,Laya.stage.height - RandomTips.height>>1);
		

		this.ctn.addChild(RandomTips);

		var HeroBox = new Sprite();
		

		var Hero = new Sprite();
		var Hero_t = Loader.getRes('./custom_assets/Hero/Hero_'+this.playerIdentity[this.getHerostep]+'.png');
		Hero.graphics.drawTexture(Hero_t,0,0);
		Hero.scale(2,2)
		Hero.size(Hero_t.width,Hero_t.height);
		Hero.pivot(Hero_t.width/2,0);
		Hero.pos(Laya.stage.width/2,100);

		var younum = new Sprite();
		var younum_t = Loader.getRes('./custom_assets/'+(this.getHerostep+1)+'.png');
		younum.graphics.drawTexture(younum_t,0,0);
		younum.pivot(younum_t.width,0);
		younum.pos(Laya.stage.width,0);
		HeroBox.addChild(younum);


		var nightTipString = this.getTipsMessage(this.playerIdentity[this.getHerostep]);
		var nightTipsText = new Text();
		nightTipsText.color = "#fff";
		nightTipsText.font = "Impact";
		nightTipsText.fontSize = 30;
		nightTipsText.text = nightTipString;
		var nightTips = new Sprite();
		var nightTips_t = Loader.getRes('./custom_assets/nightmsg.png');
		nightTips.graphics.drawTexture(nightTips_t,0,0);
		nightTips.size(nightTips_t.width,nightTips_t.height);
		nightTips.pivot(nightTips_t.width/2,0);
		nightTips.pos(Laya.stage.width/2,Hero.height*3 + 30);
		nightTipsText.pivot(nightTipsText.width/2,0);
		nightTipsText.pos(Laya.stage.width/2,Hero.height*3 + 40);
		var tips = this.getMsg(this.playerIdentity[this.getHerostep]);
		if (tips) {
			for (var k = 0; k < tips.length; k++) {
				var tipitem = new Sprite();
				var tipitem_t = Loader.getRes('./custom_assets/'+(tips[k]+1)+'.png');

				tipitem.graphics.drawTexture(tipitem_t,0,0);
				tipitem.pos(k%3 * (tipitem_t.width+20),parseInt(k/3) * tipitem_t.height + nightTips_t.height + 10);
				nightTips.addChild(tipitem);
			}
		}else
		{
			var tipitem = new Sprite();
			var tipitem_t = Loader.getRes('./custom_assets/Uknownothing.png');
			tipitem.graphics.drawTexture(tipitem_t,0,0);
			tipitem.pos(nightTips_t.width - tipitem_t.width >>1,100);
			nightTips.addChild(tipitem);
		}


		var nextbtn = new Sprite();
		var nextbtn_t = Loader.getRes('./custom_assets/getHeroBtn.png');
		nextbtn.graphics.drawTexture(nextbtn_t);
		nextbtn.size(nextbtn_t.width,nextbtn_t.height);
		nextbtn.pivot(nextbtn_t.width/2,nextbtn_t.height);
		nextbtn.pos(Laya.stage.width/2,Laya.stage.height-30);
		HeroBox.addChild(nextbtn);
		nextbtn.on(Event.CLICK,this,function(){
			if (this.playerIdentity[this.getHerostep+1]) {
				HeroBox.destroy();
				this.getHerostep++;
				this.changePlayer();
			}else
			{
				this.getHerostep = 0;
				this.ctn.destroy();
				gameframe.init();
			}
		});
		setTimeout(function() {
			RandomTips.destroy();
			getHeroframe.ctn.addChild(HeroBox);
			Tween.from(Hero,{
			scaleX:10,
			scaleY:10,
			alpha:0,
			},500,null,Handler.create(this,function()
			{
				HeroBox.addChild(nightTips);
				HeroBox.addChild(nightTipsText);
			}));
		
			
			HeroBox.addChild(Hero);
		}, 3000);
	},
	getMsg:function(hero)
	{
		var gp = [];	//好人阵营
		var bp = [];	//坏人阵营（梅林看见），除去莫德雷德
		var bp_nO = [];	//坏人阵营（坏人看见），出去奥伯伦
		var gpc = [];	//真假梅林，派西维尔看见

		for (var x = 0; x < this.playerIdentity.length; x++) {
			switch (this.playerIdentity[x]) {
				case 'gM':
					gp.push(x);
					gpc.push(x);
					break;
				case 'gP':
					gp.push(x);
					break;
				case 'bN':
					bp.push(x);
					gpc.push(x);
					bp_nO.push(x);
					break;
				case 'bA':
					bp.push(x);	
					bp_nO.push(x);				
					break;
				case 'bO':
					bp.push(x);	
					break;
				case 'bK':
					bp_nO.push(x);
					break;
				case 'gz':
					gp.push(x);
					break;
				case 'bm':
					bp.push(x);	
					bp_nO.push(x);
					break;
			
				default:
					break;
			}
		}
		
		switch (hero) {
				case 'gM':	//梅林
					return bp;
				case 'gP':	//派西维尔
					return gpc;
				case 'bN':	//莫甘娜
					return bp_nO;
				case 'bA':	//刺客
					return bp_nO;			
				case 'bO':	//奥伯伦
					return null;
				case 'bK':	//莫德雷德
					return bp_nO;
				case 'gz':	//忠诚
					return null;
				case 'bm':	//爪牙
					return bp_nO;
			}
	},
	getTipsMessage:function(hero) {
		switch(hero) {
			case 'gM':	//梅林
				return '你是好人,你看到的坏人'
			case 'gP':	//派西维尔
				return '你是好人,你看到的梅林和莫甘娜(不分前后)';
			case 'bm':	//爪牙
			case 'bN':	//莫甘娜
			case 'bA':	//刺客
				return '你是坏人,你看到的你的同伙';
			case 'bO':	//奥伯伦
				return '你是坏人,你是个看不到同伙的坏人，太惨了';
			case 'bK':	//莫德雷德
				return '你是坏人,这是你看到的同伙,但是你的同伙可看不到你';
			case 'gz':	//忠诚
				return '你是个好人，但是你啥也看不到';
		}
	},
	getAPlayer:function()
	{
		for (var k = 0; k < getHeroframe.playerIdentity.length; k++) {
			if (getHeroframe.playerIdentity[k] == 'bA') {
				return k;
			}
		}
		return false;
	}
} 

var gameframe = 
{
	ctn:null,
	nowround:0,
	round:[0,0,0,0,0],
	winRule:null,
	extendRule:false,
	RoundTable:null,
	VoteTable:null,
	VoteRound:1,
	VotePool:[],
	tmpVotePool:[],
	init:function()
	{
		this.ctn = new Sprite();
		//'./custom_assets/round1.png',
		Laya.stage.addChild(this.ctn);
		this.creatWinRule();
		this.createRoundtable();
		
	},
	creatWinRule:function()
	{
		if (setPlayerFrame._playerNum == 5) {
			this.winRule = [2,3,2,3,3];
		}else if(setPlayerFrame._playerNum == 6)
		{
			this.winRule = [2,3,4,3,4];
		}else if (setPlayerFrame._playerNum == 7) {
			this.winRule = [2,3,3,4,4];
			this.extendRule = true;
		}else if (setPlayerFrame._playerNum>=8&&setPlayerFrame._playerNum<=10) {
			this.winRule = [3,4,4,5,5];
			this.extendRule = true;
		}else
		{
			this.winRule = [];
		}
	},
	createRoundtable:function()
	{
		this.RoundTable = new Sprite();
		
		this.ctn.addChild(this.RoundTable);

		
		

		for (var x = 0; x < this.round.length; x++) {
			var roundItem = new Sprite();
			var roundItem_t = Loader.getRes('./custom_assets/round'+(x+1)+'.png');
			roundItem.graphics.drawTexture(roundItem_t,0,0);
			roundItem.round = x;

			roundItem.size(roundItem_t.width,roundItem_t.height);
			roundItem.pivot(roundItem_t.width/2,roundItem_t.height/2);
			roundItem.pos(Laya.stage.width/2,(roundItem_t.height+50) * x);
			
			var resultscale = 0.3;
			if (this.round[x] == 1 ) {
				var resultItem = new Sprite();
				var resultItem_t = Loader.getRes('./custom_assets/mission_scuess.png');
				resultItem.pivot(resultItem_t.width/2,resultItem_t.height/2);
				resultItem.pos(roundItem_t.width-(resultItem_t.width*resultscale)/2,roundItem_t.height/2);
				resultItem.scaleX = resultscale;
				resultItem.scaleY=resultscale;
				resultItem.rotation = -45;

				resultItem.graphics.drawTexture(resultItem_t,0,0);
				roundItem.addChild(resultItem);
			}else if (this.round[x] == 2) {
				var resultItem = new Sprite();
				var resultItem_t = Loader.getRes('./custom_assets/mission_fail.png');
				resultItem.pivot(resultItem_t.width/2,resultItem_t.height/2);
				resultItem.pos(roundItem_t.width-(resultItem_t.width*resultscale)/2,roundItem_t.height/2);
				resultItem.scaleX = resultscale;
				resultItem.scaleY=resultscale;
				resultItem.rotation = -45;

				resultItem.graphics.drawTexture(resultItem_t,0,0);
				roundItem.addChild(resultItem);
			}
			
			if(this.VotePool[x])
			{
				var _votes = this.VotePool[x].shuffle();
				for (var c = 0; c < _votes.length; c++) {
					var vote = new Sprite();
					if (_votes[c]) {
						vote.graphics.drawRect(0,0, 20,20,'#ff5b5b');
						vote.pos(c*(20+5) + 20,roundItem.height - 20 >>1);
						roundItem.addChild(vote);
					}else
					{
						vote.graphics.drawRect(0,0, 20,20,'#3ea012');
						vote.pos(c*(20+5) + 20,roundItem.height - 20 >>1);
						roundItem.addChild(vote);
					}
				}
			}

			this.RoundTable.addChild(roundItem);

			roundItem.on(Event.CLICK,this,function(e)
			{
				console.log(gameframe.nowround);
				if (e.target.round == gameframe.nowround) {
					this.createVoteTable();
					this.RoundTable.destroy();
				}else
				{
					console.log('ddd')
				}
			})
		}
		

		this.RoundTable.autoSize = true;

		var _nowround = new Text();
		_nowround.font = "Impact";
		_nowround.fontSize = 40;
		_nowround.text = '这是第 '+(this.nowround+1)+' '+' 轮任务！请慎重挑选队员！';
		_nowround.pos(Laya.stage.width -_nowround.width >>1,this.RoundTable.height);
		this.RoundTable.addChild(_nowround);

		var VoteNumTips = new Text();
		VoteNumTips.color = "#333333";
		VoteNumTips.font = "Impact";
		VoteNumTips.fontSize = 40;
		VoteNumTips.text = '这轮需要'+this.winRule[this.nowround]+'个队员参加';
		VoteNumTips.pos(Laya.stage.width -VoteNumTips.width >>1,this.RoundTable.height);
		this.RoundTable.addChild(VoteNumTips);
		

		if (this.extendRule&&this.nowround == 3) {
			var winNum = new Text();
			winNum.color = "#333333";
			winNum.font = "Impact";
			winNum.fontSize = 40;
			winNum.text = '需要 2 人投失败票任务才失败';
			winNum.pos(Laya.stage.width -winNum.width >>1,this.RoundTable.height);
			this.RoundTable.addChild(winNum);
		}else
		{
			var winNum = new Text();
			winNum.color = "#333333";
			winNum.font = "Impact";
			winNum.fontSize = 40;
			winNum.text = '只需要 1 人投失败票任务就失败';
			winNum.pos(Laya.stage.width -winNum.width >>1,this.RoundTable.height);
			this.RoundTable.addChild(winNum);
		}

		this.RoundTable.pos(0,Laya.stage.height - this.RoundTable.height >>1)
	},
	createVoteTable:function()
	{
		this.VoteTable?this.VoteTable.destroy():'';

		var waitTips = new Sprite();
		var waitTips_t = Loader.getRes('./custom_assets/waitTips.png');
		waitTips.graphics.drawTexture(waitTips_t,0,0);
		waitTips.pos(Laya.stage.width - waitTips_t.width >>1,Laya.stage.height - waitTips_t.height >>1);
		this.ctn.addChild(waitTips);

		this.VoteTable = new Sprite();
		this.VoteTable.graphics.drawRect(0,0,Laya.stage.width,Laya.stage.height,'#333333');

		

		this.VoteBox = new Sprite();
		
		var VoteTips = new Sprite();
		var VoteTips_t = Loader.getRes('./custom_assets/VoteTips.png');
		VoteTips.graphics.drawTexture(VoteTips_t,0,0);
		VoteTips.pos(Laya.stage.width - VoteTips_t.width>>1,60);
		this.VoteBox.addChild(VoteTips);

		this.createVoteItem();

		this.VoteTable.addChild(this.VoteBox);

		setTimeout(function() {
			waitTips.destroy();
			gameframe.ctn.addChild(gameframe.VoteTable);
		}, 1000);
		
		
	},
	createVoteItem()
	{
		var lor = Math.random()>0.5?true:false;
		var SuccessItem = new Sprite();
		var SuccessItem_t = Loader.getRes('./custom_assets/successVote.png');
		SuccessItem.size(SuccessItem_t.width,SuccessItem_t.height);
		SuccessItem.graphics.drawTexture(SuccessItem_t,0,0);

		var failItem = new Sprite();
		var failItem_t = Loader.getRes('./custom_assets/failVote.png');
		failItem.size(failItem_t.width,failItem_t.height);
		failItem.graphics.drawTexture(failItem_t,0,0);

		if (lor) {
			
			SuccessItem.pos((Laya.stage.width-SuccessItem_t.width>>1) + SuccessItem_t.width/2 + 10,Laya.stage.height/2);
			failItem.pos((Laya.stage.width-failItem_t.width>>1)-failItem_t.width/2 -10,Laya.stage.height/2);
		}else
		{
			SuccessItem.pos((Laya.stage.width-SuccessItem_t.width>>1) - SuccessItem_t.width/2 - 10,Laya.stage.height/2);
			failItem.pos((Laya.stage.width-failItem_t.width>>1)+failItem_t.width/2 + 10,Laya.stage.height/2);
		}
		SuccessItem.on(Event.CLICK,this,function()
		{
			this.tmpVotePool.push(1);
			if (this.VoteRound+1<=this.winRule[this.nowround]) {
				this.createVoteTable();
				this.VoteRound++;
			}else
			{
				console.log(this.tmpVotePool);
				this.VoteTable.destroy();
				this.createResultTable();
			}

		});
		failItem.on(Event.CLICK,this,function()
		{
			this.tmpVotePool.push(0);
			if (this.VoteRound+1<=this.winRule[this.nowround]) {
				this.createVoteTable();
				this.VoteRound++;
			}else
			{
				console.log(this.tmpVotePool);
				this.VoteTable.destroy();
				this.createResultTable();
			}

		});

		this.VoteBox.addChild(SuccessItem);
		this.VoteBox.addChild(failItem);
	},
	createResultTable:function()
	{
		
		var resultBox = new Sprite();
		
		this.ctn.addChild(resultBox);

		var roundItem_result = new Sprite();
		var roundItem_result_t = Loader.getRes('./custom_assets/round'+(this.nowround+1)+'.png');
		roundItem_result.graphics.drawTexture(roundItem_result_t,0,0);

		roundItem_result.size(roundItem_result_t.width,roundItem_result_t.height);
		roundItem_result.pivot(roundItem_result_t.width/2,roundItem_result_t.height/2);
		roundItem_result.pos(Laya.stage.width/2,Laya.stage.height/2);

		resultBox.addChild(roundItem_result);

		var resultItem = new Sprite();
		var _result = this.missionResult();
		var resultItem_t;
		if (_result) {
			resultItem_t = Loader.getRes('./custom_assets/mission_scuess.png');
		}else
		{
			resultItem_t = Loader.getRes('./custom_assets/mission_fail.png');
		}
		resultItem.graphics.drawTexture(resultItem_t,0,0);
		resultItem.pivot(resultItem_t.width/2,resultItem_t.height/2);
		resultItem.pos(Laya.stage.width/2,Laya.stage.height/2);
		resultItem.rotation = -45;
		setTimeout(function() {
			resultBox.addChild(resultItem);
			Tween.from(resultItem,{
			scaleX:10,
			scaleY:10,
			alpha:0,
			rotation:0,
			},500,null,Handler.create(this,function()
			{
				setTimeout(function() {
					
					gameframe.round[gameframe.nowround] = _result?1:2;
					if (!gameframe.gameResult(0)) {
						resultframe.init(false);
						gameframe.ctn.destroy();
						gameframe.clearRestart();
					}else if (gameframe.gameResult(1)) {
						resultframe.init(true);
						gameframe.ctn.destroy();
						gameframe.clearRestart();
					}else if (gameframe.nowround == 4&&gameframe.gameResult()) {
						resultframe.init(true);
						gameframe.ctn.destroy();
						gameframe.clearRestart();
					}else
					{
						gameframe.nowround++;
						gameframe.VotePool.push(gameframe.tmpVotePool);
						gameframe.tmpVotePool = [];
						gameframe.VoteRound = 1;
						resultBox.destroy();
						gameframe.createRoundtable();
					}
					
					
				}, 2000);
			}));
		}, 2000);
	},
	missionResult:function()
	{
		var successNum=0,
			failNum=0;
		console.log(this.tmpVotePool)
		for (var j = 0; j < this.tmpVotePool.length; j++) {
			if (this.tmpVotePool[j] == 1) {
				successNum++
			}else
			{
				failNum++;
			}
		}
		if (this.extendRule&&this.nowround == 3) {	//第四轮
			if (failNum>=2) {
				return false;
			}else{
				return true;
			}
		}else
		{
			console.log(failNum)
			if (failNum>=1) {
				return false;
			}else
			{
				return true;
			}
		}
	},
	gameResult:function(type)
	{
		var successRound = 0;
		var failRound = 0;
		for (var j = 0; j < this.round.length; j++) {
			if (this.round[j] == 1) {
				console.log('su')
				successRound++;
			}else if (this.round[j] == 2) {
				console.log('fa')
				failRound++;
			}
		}
		switch (type) {
			case 1:
				if (successRound>=3) {
					return true;
				}else
				{
					return false;
				}
			case 0:
				if (failRound>=3) {
					return false;
				}else
				{
					return true;
				}
		}
		
	},
	clearRestart:function()
	{
		this.ctn = null;
		this.nowround = 0,
		this.round = [0,0,0,0,0];
		this.winRule = null;
		this.extendRule = false;
		this.RoundTable = null;
		this.VoteTable = null;
		this.VoteRound = 1;
		this.VotePool = [];
		this.tmpVotePool = [];
	}
};
var resultframe = 
{
	ctn:null,
	init:function(result)
	{
		this.ctn = new Sprite();

		var successResult = new Sprite();
		// successResult.graphics.drawRect(0,0,Laya.stage.width,Laya.stage.height,'#ffffff');

		if (result) {
			var bA = getHeroframe.getAPlayer(); 
			if (bA) {
					var _resulttext = new Text();
					_resulttext.color = "#ffffff";
					_resulttext.font = "Impact";
					_resulttext.fontSize = 50;
					_resulttext.text = '请 '+(bA+1)+' '+'号玩家出来刺杀梅林';
					_resulttext.pos(Laya.stage.width -_resulttext.width >>1,(Laya.stage.height -_resulttext.height >>1)-300);
					successResult.addChild(_resulttext);

					var killBox = new Sprite();

					var test = getHeroframe.playerIdentity;
					for (var k = 0; k < test.length; k++) {
						var tipitem = new Sprite();
						var tipitem_t = Loader.getRes('./custom_assets/'+(k+1)+'.png');
						tipitem.playerNum = k;
						tipitem.size(tipitem_t.width,tipitem_t.height);

						tipitem.graphics.drawTexture(tipitem_t,0,0);
						tipitem.pos(k%3 * (tipitem_t.width+20),parseInt(k/3) * (tipitem_t.height + 20));
						killBox.addChild(tipitem);
						tipitem.on(Event.CLICK,this,function(e)
						{
								successResult.removeChildren();
								var _resulttext = new Text();
								_resulttext.color = "#ffffff";
								_resulttext.font = "Impact";
								_resulttext.fontSize = 50;
								_resulttext.text = test[e.target.playerNum]=='gM'?'游戏结束，坏人胜利！':'游戏结束,好人胜利！';
								_resulttext.pos(Laya.stage.width -_resulttext.width >>1,(Laya.stage.height -_resulttext.height >>1)-300);
								successResult.addChild(_resulttext);

								var restartbtn = new Sprite();
								restartbtn.graphics.drawRect(0,0,Laya.stage.width-60, 120,'#333333');
								restartbtn.pos(30,Laya.stage.height/2- 60);
								restartbtn.size(Laya.stage.width-60,120)
								

								var btntext = new Text();
								btntext.color = "#ffffff";
								btntext.font = "Impact";
								btntext.fontSize = 50;
								btntext.text = '重新开始';
								btntext.pos(restartbtn.width -btntext.width >>1,(restartbtn.height - btntext.height >>1) - 10);
								restartbtn.addChild(btntext);

								restartbtn.on(Event.CLICK,this,function()
								{
									this.ctn.destroy();
									welcomeFrame.init();
								})

								successResult.addChild(restartbtn);
						})
					}
					killBox.autoSize = true;
					killBox.pos(Laya.stage.width - killBox.width >>1,Laya.stage.height - killBox.height >>1)
					successResult.addChild(killBox);
				}else
				{
					successResult.removeChildren();
					var _resulttext = new Text();
					_resulttext.color = "#ffffff";
					_resulttext.font = "Impact";
					_resulttext.fontSize = 50;
					_resulttext.text = '游戏结束,好人胜利！';
					_resulttext.pos(Laya.stage.width -_resulttext.width >>1,(Laya.stage.height -_resulttext.height >>1)-300);
					successResult.addChild(_resulttext);

					var restartbtn = new Sprite();
					restartbtn.graphics.drawRect(0,0,Laya.stage.width-60, 120,'#333333');
					restartbtn.pos(30,Laya.stage.height/2- 60);
					restartbtn.size(Laya.stage.width-60,120)
								

					var btntext = new Text();
					btntext.color = "#ffffff";
					btntext.font = "Impact";
					btntext.fontSize = 50;
					btntext.text = '重新开始';
					btntext.pos(restartbtn.width -btntext.width >>1,(restartbtn.height - btntext.height >>1) - 10);
					restartbtn.addChild(btntext);

					restartbtn.on(Event.CLICK,this,function()
					{
						this.ctn.destroy();
						welcomeFrame.init();
					})

								successResult.addChild(restartbtn);
				}
				this.ctn.addChild(successResult);
			}else
			{
				var _resulttext = new Text();
				_resulttext.color = "#ffffff";
				_resulttext.font = "Impact";
				_resulttext.fontSize = 50;
				_resulttext.text = '游戏结束，坏人胜利！';
				_resulttext.pos(Laya.stage.width -_resulttext.width >>1,(Laya.stage.height -_resulttext.height >>1)-300);
				successResult.addChild(_resulttext);

				var restartbtn = new Sprite();
				restartbtn.graphics.drawRect(0,0,Laya.stage.width-60, 120,'#333333');
				restartbtn.pos(30,Laya.stage.height/2- 60);
				restartbtn.size(Laya.stage.width-60,120)
								

				var btntext = new Text();
				btntext.color = "#ffffff";
				btntext.font = "Impact";
				btntext.fontSize = 50;
				btntext.text = '重新开始';
				btntext.pos(restartbtn.width -btntext.width >>1,(restartbtn.height - btntext.height >>1) - 10);
				restartbtn.addChild(btntext);

				restartbtn.on(Event.CLICK,this,function()
				{
					this.ctn.destroy();
					welcomeFrame.init();
				});
				successResult.addChild(restartbtn);
				this.ctn.addChild(successResult);
			}
		Laya.stage.addChild(this.ctn);
	}
}

//添加数组打乱原型方法
Array.prototype.shuffle = function() {
	var array = this;
	var m = array.length,
	t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
}

window.onload = function()
{
	

    //初始化舞台
	(function()
	{
		Laya.MiniAdpter.init();
		// 不支持WebGL时自动切换至Canvas
		Laya.init(DesignProp.width, DesignProp.height, Laya.HTMLCanvas);

		Laya.stage.alignV = Stage.ALIGN_MIDDLE;
		Laya.stage.alignH = Stage.ALIGN_CENTER;

		Laya.stage.scaleMode = Stage.SCALE_FIXED_WIDTH;	//应用根据屏幕大小铺满全屏，非等比缩放会变型，stage的宽高等于设计宽高。
		Laya.stage.screenMode = Stage.SCREEN_VERTICAL;

		Laya.stage.bgColor = DesignProp.background;
        document.body.style.background = DesignProp.background;

		CustomLoader.loader();
	})();
}
