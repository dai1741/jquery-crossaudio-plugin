/** 
 * CrossAudio v1.0
 * 
 * クロスブラウザで動作する音声再生オブジェクトを提供するjQuery Plugin。
 * 
 * MITライセンスに準拠する。
 *  - http://www.opensource.org/licenses/mit-license.php
 * 
 * @author dai1741
 * @version 1.0, Sep 10 2010
 * @see http://
 */

(function($) {
	var defaultVolume = 0.8;
	var crossAudioCenter;
	
	var CrossAudio;
	
	/** 
	 * 音声保持＋再生用のクラス。AudioElementとFlashの違いを吸収する。
	 * 
	 * HTMLElementを継承しているので、addEventListenerとかできる。
	 * 
	 * 音声ファイルのロードが完了し、再生可能になった時にcanplayイベントを送出する。
	 * 音声ファイルが見つからなかったり、対応するファイル形式ではないときにerrorイベントを送出する。
	 * 音声がデータの最後まで到達し、停止するときにendedイベントを送出する。
	 * 音声がデータの最後まで到達し、最初に戻ってループ再生するときにrepeatイベントを送出する。
	 * 
	 * @class
	 * @extends HTMLElement
	 * @param {string} src 音声ファイルのURL
	 */
//	CrossAudio = function(src) {};

//	CrossAudio.prototype = {

		/** 
		 * 音声ファイルのURLを返す。
		 * 
		 * @return {string} 音声ファイルのURL。URLがnormalizeされるかどうかは不確定。
		 */
//		src: function() {},

		/** 
		 * 音声ファイルをロードする。
		 * 
		 * コンストラクタが呼ばれた時点でデータを読み込むので、この関数は実際には何も行わない。
		 */
//		load: function() {},

		/** 
		 * 現在の再生位置を秒単位で返す。
		 * 
		 * 引数が指定されていた場合、現在の再生位置をその位置に変更する。
		 * 
		 * @param {number} [time] 新しい再生位置。
		 * @return {number} 秒単位の現在の再生位置。timeが指定されていたときはその値
		 */
//		currentTime: function(time) {},

		/** 
		 * 音声の長さを秒単位で返す。
		 * 
		 * @return {number} 音声の長さ。秒単位
		 */
//		duration: function() {},

		/** 
		 * 音声が一時停止しているかどうかを返す。
		 * 
		 * 一度も再生していないときこの関数はtrueを返す。
		 * 
		 * @return {boolean} 音声が一時停止しているならtrue、そうでないならfalse
		 */
//		paused: function() {},

		/** 
		 * 音声の再生が終了したかどうかを返す。
		 * 
		 * この関数の戻り値が新しくtrueになるとき、endedイベントがトリガーされる。
		 * 
		 * @return {boolean} 音声の再生が終了しているならtrue、そうでないならfalse
		 */
//		ended: function() {},

		/** 
		 * 現在の音声がループ再生するかどうかを返す。
		 * 
		 * 引数が指定されていた場合、ループ指定を更新する。
		 * 
		 * @param {boolean} [loop] 新しいループ指定
		 * @return {boolean} 現在の音声がループ再生するならtrue、しないならfalse。loopが指定されていたときはその値
		 */
//		loop: function(loop) {},

		/** 
		 * 音声を再生する。
		 * 
		 * すでに音声が再生されている(!this.paused())なら、何もしない。
		 */
//		play: function() {},

		/** 
		 * 音声を一時停止する。
		 * 
		 * すでに音声が一時停止している(this.paused())なら、何もしない。
		 */
//		pause: function() {},

		/** 
		 * 現在の音量を返す。
		 * 
		 * 引数が指定されていた場合、現在の音量をその値に変更する。
		 * 0が無音で、1が最大音量。
		 * 数値が範囲外のときは自動的に0か1に是正される。
		 * 
		 * @param  {number} [volume] 新しい音量。
		 * @return {number} 現在の音量。volumeが指定されていたときはその音量
		 */
//		volume: function(volume) {},

		/** 
		 * 音声がミュートされているかどうかを返す。
		 * 
		 * 引数が指定されていた場合、現在のミュート指定を変更する。
		 * 
		 * @param  {boolean} [muted] 新しいミュート指定。
		 * @return {boolean} ミュートされているならtrue、そうでないならfalse。mutedが指定されていたときはその値
		 */
//		muted: function(muted) {},

		/** 
		 * 音声を停止し、最初の位置に戻る。
		 */
//		 stop: function() {}

		/** 
		 * 内部で保存している音声データを開放する。
		 * 音声が停止しているなら、明示的に呼ぶ必要はない。
		 * 
		 * 音声ファイルのキャッシュは保持されることが想定されているが、それはブラウザ・Flashの裁量。
		 */
//		 dispose: function() {}
//	};
	
	
	/** 
	 * メイン処理。
	 * この処理が終わり次第、crossaudioreadyイベントをdocumentでトリガーする。
	 * AudioオブジェクトとFlashの両方が使用できない場合、crossaudioreadyイベントの直前にcannotplayaudioイベントをdocumentでトリガーする。
	 */
	$(document).ready(function() {
		
		//Audio対応かどうかのチェック
		var canUseAudio = false;
		var canPlayOgg = false;
		var canPlayMp3 = false;
		try {
			var testAudio = new Audio("");
			canUseAudio = typeof testAudio.play == 'function';
			if(canUseAudio) {
				canPlayOgg = testAudio.canPlayType('audio/ogg') != 'no' && testAudio.canPlayType('audio/ogg') != '';
				canPlayMp3 = testAudio.canPlayType('audio/mpeg') != 'no' && testAudio.canPlayType('audio/mpeg') != '';
			}
		}
		catch(e) { }
	
		var canUseFlash = function (version){
			// Function checkForFlash adapted from FlashReplace by Robert Nyman
			// http://code.google.com/p/flashreplace/
			var flashIsInstalled = false;
			var flash;
			if(window.ActiveXObject){
				try{
					flash = new ActiveXObject(("ShockwaveFlash.ShockwaveFlash." + version));
					flashIsInstalled = true;
				}
				catch(e){
					// Throws an error if the version isn't available
				}
			}
			else if(navigator.plugins && navigator.mimeTypes.length > 0){
				flash = navigator.plugins["Shockwave Flash"];
				if(flash){
					var flashVersion = navigator.plugins["Shockwave Flash"].description.replace(/.*\s(\d+\.\d+).*/, "$1");
					if(flashVersion >= version){
						flashIsInstalled = true;
					}
				}
			}
			return flashIsInstalled;
		}(10);
		
		if(canUseFlash)
			canPlayMp3 = true;
		
		var methods = {};
		
		//共通操作
		methods.load = function() {};
		methods.stop = function() {
			this.pause();
			this.currentTime(0);
			this.used = false;
		};
		
		if(canUseAudio && !canUseFlash) { //FirefoxやChromeのaudio対応が微妙なので、Flashが使えるならそちらを優先
			CrossAudio = function(src) {
				var self = document.createElement('div'); //addEventListerできるようにするためHTMLElementだと言い張る
				self.instance = new Audio(src);
				self.instance.preload = 'auto';
				self.instance.volume = defaultVolume;
				
				self.used = false;
				//self.audioSrc = src;
				
				$(self.instance).bind('canplay', function() {
					$(self).triggerHandler('canplay');
				})
				.bind('ended', function() {
					$(self).triggerHandler('ended');
					self.used = false;
				})
				.bind('seeked', function() {
					if(!self.paused()) //stopによるrewindを叩き潰す
						$(self).triggerHandler('repeat');
				})
				.bind('playing', function() {
					$(self).triggerHandler('playing');
					self.used = true;
				})
				.bind('error', function() {
					$(self).triggerHandler('error');
					self.used = false;
				});
				
				return $.extend(self, methods);
			};
			
			$.each(['src', 'currentTime', 'loop', 'muted'], function(i, s) {
				methods[s] = function(val) {
					return val == undefined
						? this.instance[s]
						: this.instance[s] = val;
				};
			});
			$.each(['play', 'pause'], function(i, s) {
				methods[s] = function() {
					this.instance[s]();
				};
			});
			$.each(['duration', 'paused', 'ended'], function(i, s) {
				methods[s] = function() {
					return this.instance[s];
				};
			});
			
			methods.volume = function(val) {
				return val == null
					? this.instance.volume
					: this.instance.volume = Math.max(0, Math.min(val - 0, 1));
			};
			
			methods.dispose = function() {
				this.stop();
				this.instance = null;
			};
			
			setTimeout(function() { //Flashとタイミングを極力同じにするため別スレッドへ
				$(document).trigger('crossaudioready');
			}, 1);
		}
		else if(canUseFlash) {
			CrossAudio = function(src) {
				var self = document.createElement('div');
				self.audioId = crossAudioCenter.newAudio(src);
				
				$.crossAudio.audioBiMap[self.audioId] = self;
				
				self.used = false;
				
				$(self).bind('ended', function() {
					this.used = false;
				})
				.bind('playing', function() {
					this.used = true;
				});
				
				return $.extend(self, methods);
			};
			
			$.each(['src', 'currentTime', 'duration', 'paused', 'ended', 'play', 'pause'], function(i, s) {
				methods[s] = function() {
					return crossAudioCenter.swfProxy(s, this.audioId);
				};
			});
			$.each(['loop', 'volume', 'muted'], function(i, s) {
				methods[s] = function(val) {
					return crossAudioCenter.swfProxy(s, this.audioId, val);
				};
			});
			
			methods.dispose = function() {
				return crossAudioCenter.dispose(this.audioId);
			};
			
			var swfName = 'FlashAudio.swf?' + new Date().getTime(); //コンストラクタを確実に呼ぶためタイムスタンプを残す
			
			if($('#crossAudio-center').length == 0) {
				if($.browser.msie) {
					document.body.innerHTML += '<object id="crossAudio-center" '
							+ 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="1" '
							+ 'height="1" codebase="http://fpdownload.adobe.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0">'
							+ '<param name="movie" value="' + swfName + '" />'
							+ '<param name="allowScriptAccess" value="always" />'
							+ '</object>';
				}
				else {
					$('body').append('<embed id="crossAudio-center" name="crossAudio-center" src="' + swfName + '" '
							+ 'allowScriptAccess="always" width="1" height="1" type="application/x-shockwave-flash" '
							+ 'pluginspage="http://www.macromedia.com/go/getflashplayer" />');
				}
			}
			crossAudioCenter = $('#crossAudio-center')[0];
			
		}
		else { //AudioオブジェクトもFlashも使えない場合
			
			//何もしないダミークラスを生成する
			CrossAudio = function(src) {
				var self = document.createElement('div');
				return $.extend(self, methods);
			};
			
			$.each(['currentTime', 'duration', 'volume'], function(i, s) {
				methods[s] = function(val) {
					return 0;
				};
			});
			$.each(['paused', 'ended', 'loop', 'muted'], function(i, s) {
				methods[s] = function() {
					return false;
				};
			});
			$.each(['src'], function(i, s) {
				methods[s] = function() {
					return "";
				};
			});
			$.each(['play', 'pause', 'dispose'], function(i, s) {
				methods[s] = function() {};
			});
			
			setTimeout(function() {
				$(document).trigger('cannotplayaudio').trigger('crossaudioready');
			}, 1);
		}
		
		
		jQuery.extend({
			crossAudio: { 
				/**
				 * Flashから呼ばれるプライベート関数
				 * @private
				 */
				notifyLoaded: function() {
					$(document).trigger('crossaudioready');
				},
				
				/**
				 * Flashから呼ばれるプライベート関数
				 * @private
				 */
				triggerEvent: function(eventName, audioId) {
					var audio = $.crossAudio.audioBiMap[audioId];
					$(audio).triggerHandler(eventName); //triggerではaudio[eventName]も発火してしまう
				},
				
				/**
				 * audioIdからCrossAudioを逆引きするためのプライベート連想配列
				 * @private
				 */
				audioBiMap: {},
				
				/** 
				 * 新しいCrossAudioオブジェクトを生成する。
				 * 
				 * 引数が指定されていた場合、ループ指定を更新する。
				 * 
				 * @param {string} src 音声ファイルのURL
				 * @return {CrossAudio} 新しいCrossAudio
				 */
				make: function(src) {
					return new CrossAudio(src);
				},
				
				/** Audioオブジェクトが使用可能かどうか */
				canUseAudio: canUseAudio,
				
				/** Flashが使用可能かどうか */
				canUseFlash: canUseFlash,
				
				/** CrossAudioクラスが使用できるかどうか */
				canUseFlash: (canUseAudio || canUseFlash),
				
				/** oggファイルを再生できるかどうか */
				canPlayOgg: canPlayOgg,
				
				/** mp3ファイルを再生できるかどうか */
				canPlayMp3: canPlayMp3,
				
				/** デフォルトの音量 */
				defaultVolume: defaultVolume
			}
		});
	});
}(jQuery));