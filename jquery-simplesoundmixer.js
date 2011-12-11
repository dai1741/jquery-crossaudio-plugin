/** 
 * SimpleSoundMixer v1.0
 * 
 * 怠惰なサウンドミキサー。
 * サウンドプールを生成して音声をキャッシュし、同時に複数の音を鳴らすことができる。
 * とりあえずjsで音を鳴らしたいときに使う。jQuery Plugin。
 * 
 * MITライセンスに準拠する。
 *  - http://www.opensource.org/licenses/mit-license.php
 * 
 * @author dai1741
 * @version 1.0, Sep 10 2010
 * @see http://
 */

(function($) {

	var deleteAudio;
	var filenameEx;
	
	$(document).bind('crossaudioready', function() {

		deleteAudio = !$.crossAudio.canUseFlash
			? function(elm, list, index) {
				list[index].dispose();
				list.splice(index, 1);
			}
			: function(elm, list, index) {
				delete $.crossAudio.audioBiMap[list[index].audioId];
				list[index].dispose();
				list.splice(index, 1);
			};
		
		//mp3が再生できなければoggが再生できるということにする
		filenameEx = $.crossAudio.canPlayMp3 ? '.mp3' : '.ogg';
	});
	
	var cleanVolatileAudios = function(elm) {
		var volatileAudios = $.data(elm, 'crossAudio-volatileAudios');
		for(url in volatileAudios) {
			for(var i = 0; i < volatileAudios[url].length; i++) {
				if(!volatileAudios[url][i].used) {
					deleteAudio(elm, volatileAudios[url], i);
					i--;
				}
			}
		}
		//console.log("cleaned.");
	};
	
	var ensureLexical = function(elm) {
		if($.data(elm, 'crossAudio-lexicalData') == undefined) {
			$.data(elm, 'crossAudio-lexicalData', {
				modCount: 0,
				currentVolume: $.crossAudio.defaultVolume,
				volume: {},
				globalVolume: $.crossAudio.defaultVolume,
				muted: {},
				mutedGlobal: false
			});
			$.data(elm, 'crossAudio-volatileAudios', {});
		}
	};
	
	var singleton = function(str) {
		var set = {}; set[str] = 1; return set;
	};
	
	var manageAudio = function(url, loop, gonnaPlay, callback) {
	
		return this.each(function() {
			var self = $(this);
		
			ensureLexical(this);
			var lexicalData = $.data(this, 'crossAudio-lexicalData');
			var volatileAudios = $.data(this, 'crossAudio-volatileAudios');
			
			var audio = $.crossAudio.make(url + filenameEx);
			
			audio.loop(loop);
			audio.muted(lexicalData.mutedGlobal || lexicalData.muted[url]);
			
			audio.volume(lexicalData.volume[url] != undefined
					? lexicalData.volume[url] * lexicalData.globalVolume
					: lexicalData.globalVolume);
			
			if(lexicalData.modCount > 30) { //適当な定数
				cleanVolatileAudios(this);
				lexicalData.modCount = 0;
			}
			
			if(volatileAudios[url] == undefined)
				volatileAudios[url] = [];
			volatileAudios[url].push(audio);
			
			lexicalData.modCount++;
			
			gonnaPlay ? audio.play()
			          : audio.load();
				
			if($.isFunction(callback)) {
				if(!gonnaPlay)
					$(audio).one('canplay', callback);
				else if(loop) {
					$(audio).bind('repeat', callback);
				}
				else
					$(audio).one('ended', callback);
			}
			else if(typeof callback == 'object') {
				var jAudio = $(audio);
				for(eventName in callback) {
					jAudio.bind(eventName, callback[eventName]);
				}
			}
		});
	};
	
	/** 
	 * 音声オブジェクトの生成＋1回再生。
	 * 
	 * 再生終了時にendedイベントが発生する。
	 * 同時に複数の音を鳴らすことができる。
	 * 
	 * @function
	 * @param {string} url 音声ファイルのURL。拡張子を含まず、後から'.mp3'あるいは'.ogg'が付加される。
	 * @param {function|Object} [callback] endedイベントにbindされるコールバック関数。あるいは、イベント名をキーとした関数の連想配列。
	 * @return {jQuery}
	 */
	jQuery.fn.playAudio = function(url, callback) {
		return manageAudio.call(this, url, false, true, callback);
	};
	
	/** 
	 * 音声オブジェクトの生成＋ループ再生。
	 * 
	 * ループ時にrepeatイベントが発生する。
	 * 同時に複数の音を鳴らすことができる。
	 * 
	 * @function
	 * @param {string} url 音声ファイルのURL。拡張子を含まず、後から'.mp3'あるいは'.ogg'が付加される。
	 * @param {function|Object} [callback] repeatイベントにbindされるコールバック関数。あるいは、イベント名をキーとした関数の連想配列。
	 * @return {jQuery}
	 */
	jQuery.fn.loopAudio = function(url, callback) {
		return manageAudio.call(this, url, true, true, callback);
	};
	
	/** 
	 * 音声オブジェクトの生成。
	 * 
	 * ロード完了時にcanplayイベントが発生する。
	 * 
	 * @function
	 * @param {string} url 音声ファイルのURL。拡張子を含まず、後から'.mp3'あるいは'.ogg'が付加される。
	 * @param {function|Object} [callback] canplayイベントにbindされるコールバック関数。あるいは、イベント名をキーとした関数の連想配列。
	 * @return {jQuery}
	 */
	jQuery.fn.loadAudio = function(url, callback) {
		return manageAudio.call(this, url, false, false, callback);
	};
	
	/** 
	 * 音声のミュート制御。
	 * 
	 * urlが等しい全ての音声に影響する。
	 * 
	 * @function
	 * @param {string} [url] 音声ファイルのURL。拡張子を含まない。省略時は全ての音声が対象になる。
	 * @param {boolean} [onoff] 新しいミュート状態。ミュートにするならtrue、解除するならfalse
	 * @return {jQuery} onoffを新しく指定したとき
	 * @return {boolean} onoff無指定のとき。urlの現在のミュート指定
	 */
	jQuery.fn.muteAudio = function(url, onoff) {
		var toOnoff = function(b) {
			return b == undefined || b ? 'muteon' : 'muteoff';
		};
		if(arguments.length == 0) {
			ensureLexical(this[0]);
			return $.data(this[0], 'crossAudio-lexicalData').mutedGlobal;
		}
		else if(typeof arguments[0] == 'boolean')
			return this.audioVolume(undefined, toOnoff(arguments[0]));
		else if(arguments.length == 1) {
			ensureLexical(this[0]);
			var lexicalData = $.data(this[0], 'crossAudio-lexicalData');
			return !!lexicalData.muted[url] || lexicalData.mutedGlobal;
		}
		return this.audioVolume(url, toOnoff(onoff));
	};
	
	/** 
	 * 音声のボリュームの取得と変更。
	 * 
	 * urlが等しい全ての音声に影響する。
	 * 
	 * @function
	 * @param {string} [url] 音声ファイルのURL。拡張子を含まない。省略時は全ての音声が対象になる。
	 * @param {number} [volume] 新しい音量。0が無音で、1が通常音量。1超も指定可能だが挙動は未確定。
	 * @return {jQuery} volumeを新しく指定したとき
	 * @return {boolean} volume無指定のとき。urlの現在の音量
	 */
	jQuery.fn.audioVolume = function() {
		
		//audioVolume([url], [volume])
		var url, volume;
		var args = arguments;
		
		if(arguments.length == 0)
			return $.data(this[0], 'crossAudio-lexicalData').currentVolume;
		else if(arguments.length == 1) {
			if(/^\d*\.?\d*$/.test(arguments[0])) {
				volume = arguments[0] - 0;
			}
			else {
				ensureLexical(this[0]);
				
				var lexicalData = $.data(this[0], 'crossAudio-lexicalData');
				return (lexicalData.volume[args[0]] != null)
						? lexicalData.volume[args[0]] - 0
						: 1; //urlあるので…暫定
			}
		}
		else {
			url = arguments[0];
			volume = arguments[1];
		}
		
		return this.each(function() {
			ensureLexical(this);
			
			var lexicalData = $.data(this, 'crossAudio-lexicalData');
			var changeVolume;
			if(volume == 'muteon') {
				if(url == undefined)
					lexicalData.mutedGlobal = true;
				else
					lexicalData.muted[url] = true;
				changeVolume = function(audio) {
					audio.muted(true);
				};
			}
			else if(volume == 'muteoff') {
				if(url == undefined)
					lexicalData.mutedGlobal = false;
				else if(lexicalData.muted[url])
					delete lexicalData.muted[url];
				
				changeVolume = function(audio) {
					audio.muted(false);
				};
			}
			else { //assert volume is number
				volume = volume - 0;
				if(url == undefined) {
					lexicalData.globalVolume = volume;
					changeVolume = function(audio, url) {
						audio.volume(volume * lexicalData[url].volume);
					};
				}
				else {
					lexicalData.volume[url] = volume;
					changeVolume = function(audio) {
						audio.volume(lexicalData.globalVolume * volume);
					};
				}
				
			}
			
			var volatileAudios = $.data(this, 'crossAudio-volatileAudios');
			for(url in (url == undefined ? volatileAudios : singleton(url))) {
				if(volatileAudios[url])
					for(var i = 0; i < volatileAudios[url].length; i++) {
						if(!volatileAudios[url][i].used) {
							deleteAudio(this, volatileAudios[url], i);
							i--;
						}
						else {
							changeVolume(volatileAudios[url][i], url);
						}
					}
			}
			lexicalData.modCount = 0; //cleanVolatileAudiosを呼んだのと同じになるから
		});
	};
	
	var manageStop = function(url, restart, del) {
		
		return this.each(function() {
			ensureLexical(this);
			var volatileAudios = $.data(this, 'crossAudio-volatileAudios');
			
			var stop = function(audio) {
				if(restart) {
					if(audio.used)
						audio.play();
				}
				else if(!audio.paused()) {
					audio.pause();
				}
				return del;
			};
			
			for(url in (url == undefined ? volatileAudios : singleton(url))) {
				if(volatileAudios[url]) {
					for(var i = 0; i < volatileAudios[url].length; i++) {
						if(!volatileAudios[url][i].used || stop(volatileAudios[url][i])) {
							deleteAudio(this, volatileAudios[url], i);
							i--;
						}
					}
				}
			}
		});
	};
	
	/** 
	 * 音声の停止。
	 * 
	 * urlが等しい全ての音声に影響する。
	 * 
	 * @function
	 * @param {string} [url] 音声ファイルのURL。拡張子を含まない。省略時は全ての音声が対象になる。
	 * @return {jQuery}
	 */
	jQuery.fn.stopAudio = function(url) {
		return manageStop.call(this, url, false, true);
	};
	
	/** 
	 * 音声の一時停止。
	 * 
	 * urlが等しい全ての音声に影響する。
	 * 
	 * @function
	 * @param {string} [url] 音声ファイルのURL。拡張子を含まない。省略時は全ての音声が対象になる。
	 * @return {jQuery}
	 */
	jQuery.fn.pauseAudio = function(url) {
		return manageStop.call(this, url, false, false);
	};
	
	/** 
	 * 一時停止した音声の再生。
	 * 
	 * urlが等しい全ての音声に影響する。
	 * stopAudio()で停止した音声は再開されないので注意。
	 * 
	 * @function
	 * @param {string} [url] 音声ファイルのURL。拡張子を含まない。省略時は全ての音声が対象になる。
	 * @return {jQuery}
	 */
	jQuery.fn.resumeAudio = function(url) {
		return manageStop.call(this, url, true, false);
	};
}(jQuery));