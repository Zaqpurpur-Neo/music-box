import { useContext, useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import { API_ENDPOINT, ContextAudioPlay, ContextMusicItem, ContextMusicPlayed, MusicResult, Visualizer} from './common'
import { createContext } from 'preact'
import { memo, TargetedEvent } from 'preact/compat'

const CurrentMusicPlayed = createContext<ContextMusicPlayed>({} as ContextMusicPlayed)
const MusicPlayed = createContext<ContextAudioPlay>({} as ContextAudioPlay)
const MusicList = createContext<ContextMusicItem>({} as ContextMusicItem)

function CardBox({ content }: { content: MusicResult }) {
	const {audioPlay, setAudioPlay} = useContext(MusicPlayed)
	const {musicPlayed, setMusicPlayed, setPlaying} = useContext(CurrentMusicPlayed)

	return (<div className={"card-box " + (musicPlayed.id === content.id ? "playing" : "")} onClick={() => {
		if(!musicPlayed.id || musicPlayed.id !== content.id) {
			audioPlay?.pause()

			setPlaying(true)
			setMusicPlayed(content)
			setAudioPlay(new Audio(content.music_path))
		}
	}}>
		<img className={"thumbnail"} src={content.thumbnail_path} />
		<div className={"info-section"}>
			<h1 className={"title"}>{content.music.title}</h1>
			<h4 className={"author"}>{content.author.name}</h4>

			<p className={"view-count"}>
				<i class="fa-solid fa-eye"></i>
				<span>{Intl.NumberFormat("de-DE").format(parseInt(content.music.view_count))}</span>
			</p>
			<p className={"likes"}>
				<i class="fa-solid fa-heart"></i>
				<span>{Intl.NumberFormat("de-DE").format(content.music.likes)}</span>
			</p>
		</div>
	</div>)
}

function MusicPlayerMini({ content, isPlaying, eventPlay, backwardEvent, fullScreenFn, progressPercentage = 0 }: { 
	content: MusicResult, isPlaying: boolean, progressPercentage: number,
	eventPlay: () => void,
	backwardEvent: () => void,
	fullScreenFn: () => void,
}) {
	const length = content.music.length_seconds
	return (<div className={"music-player-mini"}>
		<div className={"container"}>
			<div className={"info-section"}>
				<img src={content.thumbnail_path} />
				<div className={"more-info"}>
					<p className={"now-playing"}>Now Playing</p>
					<p className={"title"}>{content.music.title}</p>
					<p className={"author"}>{content.author.name}</p>
				</div>
			</div>
			<div className={"player"}>
				<div className={"controller"}>
					<button><i class="fa-solid fa-backward" onClick={backwardEvent}></i></button>
					<button className={"bold"} onClick={eventPlay}>
					{
						isPlaying ? 
						<i class="fa-solid fa-pause"></i> :
						<i class="fa-solid fa-play"></i>
					}
					</button>
					<button><i class="fa-solid fa-forward"></i></button>
				</div>
				<div className={"progress-section"}>
					<p>0:00</p>
					<div className={"progress-container"}>
						<div className={"progress"} style={{ width: `${progressPercentage}%`}} />
					</div>
					<p>{Math.floor(length / 60) + ":" + (length % 60 < 10 ? `0${length % 60}` : (length % 60))}</p>
				</div>
			</div>
			<div className={"settings"}>
				<button onClick={fullScreenFn} className={"fullscreen-btn"}><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>
			</div>
		</div>
	</div>)
}

function MusicFullScreen() {
	return (
		<div className={"music-player-full"}>
			<img 
				className={"sphere"} 
				src={"./sphere.svg"} />
		</div>
	)
}

function CenterContent() {
	const {music, setMusic} = useContext(MusicList)
	const [progress, setProgress] = useState(0)
	const [fullscreen, setFullscreen] = useState<boolean>(false)
	const {audioPlay} = useContext(MusicPlayed)
	const {musicPlayed, isPlaying, setPlaying} = useContext(CurrentMusicPlayed)

	const MemoList = memo(() => {
		return <div className={"music-list"}>
			{music.map(item => <CardBox key={item.id} content={item} />)}
		</div> 
	})

	useEffect(() => {
		const arg = async () => {
			const result = await fetch(API_ENDPOINT + "/get/music-all")
			const data = await result.json()
			setMusic(data)
		}
		arg()
	}, [])

	useEffect(() => {
		if(!audioPlay) return

		const fn = () => {
			setProgress(Math.floor(audioPlay.currentTime / musicPlayed.music.length_seconds * 100));
		}
		const fnDone = () => {
			audioPlay.currentTime = 0;
			setPlaying(false)
		}

		audioPlay.addEventListener("timeupdate", fn)
		audioPlay.addEventListener("ended", fnDone)

		return () => {
			audioPlay.removeEventListener("timeupdate", fn)
			audioPlay.removeEventListener("ended", fnDone)
		}
	}, [isPlaying, audioPlay])

	const handleKeyUp = (ev: KeyboardEvent) => {
		if(ev.code.toLowerCase() === "escape") {
			setFullscreen(false)
		}
	}

	useEffect(() => {
		if(fullscreen) {
			window.addEventListener("keyup", handleKeyUp, false);
			return () => window.removeEventListener("keyup", handleKeyUp, false)
		}

		return () => {}
	}, [fullscreen])

	return (
		<div className={"main-content"}>
			<div className={"scroller"}>
				<div className={"top-content"}>
					<h1>Your Music</h1>
				</div>
				<MemoList />	
			</div>

			{musicPlayed.id ? <MusicPlayerMini 
				isPlaying={isPlaying} 
				progressPercentage={progress}
				fullScreenFn={() => {
					setFullscreen(true)
				}}
				backwardEvent={() => {
					if(audioPlay) audioPlay.currentTime = 0
				}}
				eventPlay={() => {
					if(isPlaying) {
						audioPlay?.pause()
						setPlaying(false)
					} else {
						audioPlay?.play()
						setPlaying(true)
					}
				}} 
				content={musicPlayed} /> : ""}

				{fullscreen ? <MusicFullScreen /> : ""}
		</div>
	)
}


function PopupAddMusic({ onStart, onEnd }: {
	onStart: () => void,
	onEnd: (musicItem: MusicResult) => void
}) {
	const [inputer, setInputer] = useState("")

	const addMusic = async () => {
		if(inputer.length > 0) {
			onStart();
			const result = await fetch("http://localhost:4000/api?url=" + inputer)
			const data = await result.json() as MusicResult
			setInputer("")
			onEnd(data)
		}
	}

	return (
		<div className={"popup-add-music"}>
			<div className={"container"}>
				<h1 className={"mini-title"}>Add New Music</h1>
				<div className={"le-inputer"}>
					<input type="text" placeholder={"Ex: https://youtu.be/....."} onChange={ev => {
						setInputer(ev.currentTarget.value)
					}}/>
					<button className={"add-music"} onClick={addMusic}>
						<i class="fa-solid fa-plus"></i>
					</button>
				</div>
			</div>
		</div>
)
}


function Sidebar({ fnAdd }: { 
	fnAdd: () => void
}) {
	return (
		<div className={"sidebar-content"}>
			<div className={"logo"}>
				<i class="fa-solid fa-record-vinyl"></i>
			</div>

			<ul className={"sidebar-menu"}>
				<li><i class="fa-solid fa-house"></i></li>
				<button className={"add-music"} onClick={fnAdd}>
					<li><i class="fa-solid fa-plus"></i></li>
				</button>
				<li><i class="fa-brands fa-mix"></i></li>
			</ul>

			<div className={"account"}>
				<i class="fa-solid fa-user"></i>
			</div>
		</div>
	)
}

export default function App() {
	const [musicPlayed, setMusicPlayed] = useState({} as MusicResult)
	const [audioPlay, setAudioPlay] = useState<HTMLAudioElement | null>(null)
	const [isPlaying, setPlaying] = useState<boolean>(false)
	const [music, setMusic] = useState([] as Array<MusicResult>)

	const [popupOpen, setPopupOpen] = useState<boolean>(false);
	const [waitFetch, setWaitFetch] = useState<boolean>(false);

	const eventPopup = (ev: KeyboardEvent | MouseEvent) => {
		ev.preventDefault()
		
		if(waitFetch) return;

		if(ev instanceof KeyboardEvent && ev.code.toLowerCase() === "escape") {
			setPopupOpen(false)
		} else if(ev instanceof MouseEvent) {
			const popup = document.querySelector(".popup-add-music")?.querySelector(".container")  
			if(ev.target && !popup?.contains(ev.target as Node)) {
				setPopupOpen(false)
			}
		}
	}

	useEffect(() => {
		if(popupOpen) {
			window.addEventListener("keyup", eventPopup, false)
			window.addEventListener("click", eventPopup, false)
			return () => { 
				window.removeEventListener("keyup", eventPopup, false) 
				window.removeEventListener("click", eventPopup, false) 			
			}
		}
		return () => {}
	}, [popupOpen, waitFetch])


	useEffect(() => {
		audioPlay?.play()

		
	}, [audioPlay])

	const MemoSidebar = memo(Sidebar)

	return (
	<MusicList.Provider  value={{ music, setMusic }}>
	<MusicPlayed.Provider value={{audioPlay, setAudioPlay}}>
		<CurrentMusicPlayed.Provider value={{ musicPlayed, setMusicPlayed, isPlaying, setPlaying}}>
			<div className="container">
				<CenterContent />
				<MemoSidebar fnAdd={() => setPopupOpen(true)} />
				{popupOpen ? <PopupAddMusic 
					onStart={() => {
						setWaitFetch(true)
					}}
					onEnd={(item) => {
						setMusic(prev => [...prev, item])
						setPopupOpen(false)
						setWaitFetch(false)
					}}
				/> : ""}
			</div>
		</CurrentMusicPlayed.Provider>
	</MusicPlayed.Provider>
	</MusicList.Provider>
	)
}
