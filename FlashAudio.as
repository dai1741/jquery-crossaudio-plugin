package {

import flash.display.Sprite;
import flash.external.ExternalInterface;
import flash.media.Sound;
import flash.media.SoundChannel;
import flash.media.SoundTransform;
import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.net.URLRequest;
import flash.system.Security;
import flash.display.*;
import flash.text.*;
import flash.utils.*;
import flash.system.System;


/**
 * An Audio player class for browsers which audio element is not available.
 * 
 * This class is used only by CrossAudio javascript object.
 */
[SWF(width=1, height=1, backgroundColor=0xEEEEEE)]
public class FlashAudio extends Sprite {
	/**
	 * Audio holder.
	 * 
	 * Each audio is given an unique id.
	 */
	protected var audioCenter:Object = {
		audios: {},
		nextId: 0
	};
	/**
	 * Audio cache.
	 * 
	 * Using url as key.
	 */
	protected var soundMap:Object = {};
	
	/**
	 * Constructor called by a browser.
	 * 
	 * Assume that ExternalInterface is available.
	 */
	public function FlashAudio() {
	
		Security.allowDomain("*");
		ExternalInterface.marshallExceptions = true;
		
		ExternalInterface.addCallback("swfProxy", swfProxy);
		ExternalInterface.addCallback("newAudio", newAudio);
		ExternalInterface.addCallback("dispose", dispose);
		
		ExternalInterface.call("$.crossAudio.notifyLoaded");
	}
	
	
	/**
	 * Proxy method calling method(or var) of Audio object.
	 * 
	 * This method is called from javascript.
	 * This refers to "proxyMethods" of "Javascript Sound Kit".
	 * Available property names are those:
	 * ・src
	 * ・load
	 * ・currentTime
	 * ・duration
	 * ・paused
	 * ・ended
	 * ・loop
	 * ・play
	 * ・pause
	 * ・volume
	 * ・muted
	 * 
	 * @param property method or var name to call.
	 * @param audioId audio id of audioCenter.
	 * @param args argumets to sent to method or var
	 * 
	 * @return return value of method or var value.
	 */
	public function swfProxy(property:String, audioId:int, ...args):* {
		try {
			var audio:Object = audioCenter.audios[audioId];
			var o:Object = audio[property];
			if (o is Function) {
				var f:Function = audio[property];
				return f.apply(audio, args);
			}
			else if(args.length == 0 || args[0] == null) {
				return audio[property];
			}
			else if(args.length > 0) {
				return audio[property] = args[0];
			}
		}
		catch(e:Error) {
		}
		return undefined;
	}
	
	/**
	 * make and register a new audio.
	 * 
	 * Data load will be started automatically.
	 * This method is called from javascript.
	 *
	 * 
	 * @param src source url. maybe relative.
	 * 
	 * @return audio id.
	 */
	public function newAudio(src:String):Number {
		
		var audioId:int = audioCenter.nextId++;
		
		var alreadyLoaded:Boolean = soundMap[src] != undefined;
		var sound:Sound = alreadyLoaded
				? soundMap[src]
				: soundMap[src] = new Sound(new URLRequest(src));
		
		audioCenter.audios[audioId] = new Audio(src, sound, audioId);
		
		if(alreadyLoaded) {
			setTimeout(function():void {
				ExternalInterface.call("$.crossAudio.triggerEvent", 'canplay', audioId);
			}, 1);
		}
		else {
			sound.addEventListener(Event.COMPLETE, function(event:Event):void {
				ExternalInterface.call("$.crossAudio.triggerEvent", 'canplay', audioId);
			});
			sound.addEventListener(IOErrorEvent.IO_ERROR, function(event:Event):void {
				ExternalInterface.call("$.crossAudio.triggerEvent", 'error', audioId);
			});
		}
		
		
		return audioId;
	}
	
	/**
	 * Delete audio data.
	 * 
	 * Data load will be started automatically.
	 * This method is called from javascript.
	 *
	 * 
	 * @param audioId audio id.
	 */
	
	public function dispose(audioId:Number):void {
		var audio:Object = audioCenter.audios[audioId];
		if(audio.channel)
			audio.channel.stop();
		
		delete audioCenter.audios[audioId];
	}
}


}





import flash.external.ExternalInterface;
import flash.events.Event;
import flash.media.Sound;
import flash.media.SoundChannel;
import flash.media.SoundTransform;
import flash.utils.setTimeout;


/**
 * A private class holding an audio channel data.
 */
class Audio {

	/**
	 * Temporary default volume. Supposed to be replaced by calling audio.volume() in javascript.
	 */
	public static const defaultVolume:Number = 0.8;
	
	/** The address of the audio resource. Supposed to be readonly. */
	public var src:String;
	
	
	/** The Sound object. Supposed to be readonly. */
	public var sound:Sound;
	
	
	/**
	 * Sound channel of the sound.
	 *
	 * this is null unless the sound is playing.
	 */
	public var channel:SoundChannel = null;
	
	
	/**
	 * Whether or not the audio is paused.
	 * 
	 * Maybe this.paused == (this.channel == null)
	 */
	public var paused:Boolean = true;
	
	/** Playback position of last pause. */
	public var pausePosition:uint = 0;
	
	/** Whether or not the audio is ended. */
	public var ended:Boolean = false;
	
	/** Whether or not the audio will loop. */
	public var loop:Boolean = false;
	
	
	/** The volume. 0 to 1. */
	private var _volume:Number = defaultVolume;
	
	/** Whether or not the audio is muted. */
	private var _muted:Boolean = false;
	
	
	/** The audio id. Assumes you don't play 2^32 audios... */
	public var audioId:int;
	
	
	
	/**
	 * Constructor. make a new audio.
	 *
	 * 
	 * @param src   source url. maybe relative.
	 * @param sound Sound object corresponding to the src.
	 * @param audioId audioId.
	 */
	public function Audio(src:String, sound:Sound, audioId:int) {
		this.src = src;
		this.sound = sound;
		this.audioId = audioId;
	}
	
	
	/**
	 * Load a media source.
	 * 
	 * This method does nothing because new Sound(src) preloads the source.
	 */
	public function load():void {
	}
	
	
	/**
	 * Get or set the current playback posision in seconds.
	 * 
	 * @param val new playback posision in seconds. omittable
	 * 
	 * @return the current playback posision in seconds.
	 */
	public function currentTime(val:*):Number {
		if(val == undefined)
			return this.channel ? this.channel.position : 0;
		
		//milliseconds to seconds
		var currentTime:Number = Math.max(0, Math.min(Number(val / 1000), this.sound.length));
		pause();
		this.pausePosition = currentTime;
		play();
		return currentTime;
	}
	
	
	/**
	 * Get the duration in seconds.
	 * 
	 * Note that this value is a bit different from HTMLAudioElement.duration() for some reason.
	 *
	 * @return the duration of the audio in seconds.
	 */
	public function duration():Number {
		return this.sound.length * 1000; //to seconds
	}
	
	
	/**
	 * Play the audio.
	 * 
	 * and set event listener and channel and so on.
	 * 
	 * @param isLoop Wheather or not the audio is looping.
	 */
	public function play(isLoop:Boolean = false):void {
		if(this.paused || isLoop) {
			this.channel = this.sound.play(this.pausePosition, 0/*, this.transform*/);
			
			changeTransformVolume(this.muted ? 0 : this.volume);
			
			this.paused = false;
			
			var audio:Audio = this;
			
			if(!isLoop) {
				setTimeout(function():void {
					ExternalInterface.call("$.crossAudio.triggerEvent", 'playing', audio.audioId);
				}, 1);
			}
			
			this.channel.addEventListener(Event.SOUND_COMPLETE, function(event:Event):void {
				audio.channel.removeEventListener(Event.SOUND_COMPLETE, arguments.callee);
				if(audio.loop) {
					audio.pausePosition = 0; //temporary
					play(true);
				}
				else {
					audio.ended = true;
					audio.channel = null;
				}
				
				setTimeout(function():void {
					ExternalInterface.call("$.crossAudio.triggerEvent",
							audio.loop ? 'repeat' : 'ended', audio.audioId);
				}, 1);
			});
		}
	}
	
	
	
	/**
	 * volume getter.
	 * 
	 * @return this.volume
	 */
	public function get volume():Number {
		return this._volume;
	}
	
	/**
	 * volume setter.
	 * 
	 * If audio is playing, this changes the transform volume additionally.
	 * 
	 * @param val new volume. 0 to 1
	 */
	public function set volume(val:Number):void {
		var volume:Number = Math.max(0, Math.min(Number(val), 1));
		if(!this.muted) {
			changeTransformVolume(volume);
		}
		this._volume = volume;
	}
	
	
	/**
	 * Change the transform volume.
	 * 
	 * No range check, no setting to this.volume.
	 * 
	 * @private
	 * @param volume
	 */
	//
	private function changeTransformVolume(volume:Number):void {
		if(this.channel) {
			var stf:SoundTransform = this.channel.soundTransform;
			stf.volume = volume;
			this.channel.soundTransform = stf;
		}
	}
	
	
	/**
	 * Pause the audio.
	 * 
	 * Assumes this.channel != null.
	 */
	public function pause():void {
		this.pausePosition = this.channel.position;
		this.channel.stop();
		this.channel = null;
		this.paused = true;
	}
	
	
	/**
	 * muted getter.
	 * 
	 * @return this.muted
	 */
	public function get muted():Boolean {
		return this._muted;
	}
	
	/**
	 * muted setter.
	 * 
	 * If audio is playing, this changes the transform volume additionally.
	 * 
	 * @param val muted flag
	 */
	public function set muted(val:Boolean):void {
		if(this.channel && this.muted != val) {
			changeTransformVolume(val ? 0 : this.volume);
		}
		
		this._muted = val;
	}
	
}