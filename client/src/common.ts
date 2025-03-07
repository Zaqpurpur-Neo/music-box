import { Dispatch, StateUpdater } from "preact/hooks"

export const BASE_API_URL: string = "http://localhost:4000"
export const API_ENDPOINT: string = BASE_API_URL + "/api"

export class Visualizer {
	FFT_SIZE: number = 512;
	init: boolean = false;
	ctx: AudioContext;
	visual: MediaElementAudioSourceNode;
	analyzer: AnalyserNode;
	data: Uint8Array<ArrayBuffer>;

	constructor(audio: HTMLAudioElement) {
		this.ctx = new AudioContext();
		this.visual = this.ctx.createMediaElementSource(audio);
		this.analyzer = this.ctx.createAnalyser();
		this.analyzer.fftSize = this.FFT_SIZE;

		const bufferLen = this.analyzer.frequencyBinCount;
		this.data = new Uint8Array(bufferLen);
		this.visual.connect(this.analyzer);

		this.init = true;
	}

	getSamples(): Array<number> {
		this.analyzer.getByteTimeDomainData(this.data);
		const samples = [...this.data].map(e => e/(this.FFT_SIZE/2) - 1);
		return samples;
	}

	getVolume(): number {
		this.analyzer.getByteTimeDomainData(this.data);
		const samples = [...this.data].map(e => e/(this.FFT_SIZE/2) - 1);

		let sum = 0;
		for (let i = 0; i < samples.length; ++i) {
			sum += (samples[i] * samples[i]);
		}

		let volume = Math.sqrt(sum / samples.length);
		return volume
	}
}

export type Music = {
	author_id: string,
	descriptions: string,
	length_seconds: number,
	likes: number,
	link_id: string,
	music_id: string,
	title: string,
	view_count: string
}

export type Author = {
	author_id: string,
	name: string 
	subcriber_count: number,
}

export type MusicResult = {
	id: string,
	music: Music,
	author: Author,
	music_path: string,
	thumbnail_path: string
}

export interface ContextMusicItem {
	music: Array<MusicResult>,
	setMusic: Dispatch<StateUpdater<Array<MusicResult>>>,
}

export interface ContextMusicPlayed {
	musicPlayed: MusicResult,
	setMusicPlayed: Dispatch<StateUpdater<MusicResult>>,
	isPlaying: boolean,
	setPlaying: Dispatch<StateUpdater<boolean>>,
}

export interface ContextAudioPlay {
	audioPlay: HTMLAudioElement | null,
	setAudioPlay: Dispatch<StateUpdater<HTMLAudioElement | null>>
}
