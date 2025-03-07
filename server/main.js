const express = require("express")
const cors = require("cors")
const ytdl = require("@distube/ytdl-core")
const fs = require("fs")
const { filterFormats } = require("@distube/ytdl-core")
const { addMusic, getMusicByMusicId, addAuthor, getAuthorById, getMusicAll, getMusicAllWithArtist, setupCreateTable } = require("./db")

const port = 4000
const app = express()
app.use(cors())

app.get("/", (req, res) => {
	res.send({
		message: "Api Endpoint, Api start in /api"
	})
})

async function getAudio(url, res, req) {
	const id = ytdl.getVideoID(url)
	const fullpath = "./music-container/" + id
	const full_url = req.protocol + "://" + req.hostname + ":" + port + "/api"
	
	if(!fs.existsSync(fullpath)) {
		const info = await ytdl.getInfo(url)

		const thumbnail = info.videoDetails.thumbnail 
		const usedThumbnail = thumbnail.thumbnails[thumbnail.thumbnails.length - 1].url
		fs.mkdirSync(fullpath)

		ytdl(url, {filter: "audioonly"})
			.pipe(fs.createWriteStream(fullpath + "/music.mp3"))
			.on("finish", async () => {
				
				const author = info.videoDetails.author
				const contentAuthor = {
					author_id: author.id,
					name: author.name,
					subrciber_count: author.subscriber_count
				}
				await addAuthor(contentAuthor)

				const contentMusic = {
					title: info.videoDetails.title,
					author_id: author.id,
					link_id: id,
					descriptions: info.videoDetails.description,
					length_seconds: info.videoDetails.lengthSeconds,
					likes: info.videoDetails.likes,
					view_count: info.videoDetails.viewCount
				}

				const uuid = addMusic(contentMusic);

				const thumb = await fetch(usedThumbnail)
				const buffer = await thumb.arrayBuffer()

				fs.writeFileSync(fullpath + "/thumbnail.png", Buffer.from(buffer))

				res.send({ 
					id: id,
					music_path: full_url + "/get/music/" + id,
					thumbnail_path: full_url + "/get/thumbnail/" + id,music: contentMusic,
					author: contentAuthor
				})
			})
	} else {
		const result = await getMusicByMusicId(id)
		const author = await getAuthorById(result.author_id)
		res.send({
			url: url,
			id: id,
			music_path: full_url + "/get/music/" + id,
			thumbnail_path: full_url + "/get/thumbnail/" + id,
			author: author,
			music: result
		})
	}
}

app.get("/api", async (req, res) => {
	const url = req.query["url"]
	await getAudio(url, res, req)	
})

app.get("/api/get-id/:id", async (req, res) => {
	const id = req.params.id
	const result = await getMusicByMusicId(id)
	const author = await getAuthorById(result.author_id)
	const full_url = req.protocol + "://" + req.hostname + ":" + port + "/api"
	res.send({
		id: id,
		music_path: full_url + "/get/music/" + id,
		thumbnail_path: full_url + "/get/thumbnail/" + id,
		author: author,
		music: result
	})
})

app.get("/api/audio-url", (req, res) => {	
	const full_url = req.protocol + "://" + req.hostname + ":" + port + "/api"
	const dir = fs.readdirSync("./music-container").map(item => full_url + "/get-id/" + item)
	res.send({
		list: dir
	})
})

app.get("/api/get/music-all", async (req, res) => {
	const result = await getMusicAllWithArtist()
	const full_url = req.protocol + "://" + req.hostname + ":" + port + "/api"

	const mapper = result.map((item) => {
		return {
			id: item.link_id,
			music_path: full_url + "/get/music/" + item.link_id,
			thumbnail_path: full_url + "/get/thumbnail/" + item.link_id,
			music: {
				author_id: item.author_id,
				descriptions: item.descriptions,
				length_seconds: item.length_seconds,
				likes: item.likes,
				link_id: item.link_id,
				music_id: item.music_id,
				title: item.title,
				view_count: item.view_count
			},
			author: {
				author_id: item.author_id,
				name: item.name,
				subcriber_count: item.subcriber_count 
			}
		} 
	})

	res.send(mapper)
})

app.get("/api/get/thumbnail/:id", (req, res) => {
	const id = req.params.id
	const filepath = "./music-container/" + id + "/thumbnail.png"

	res.setHeader("Content-Type", "image/png")
	fs.createReadStream(filepath).pipe(res)
})

app.get("/api/get/music/:id", (req, res) => {
	const id = req.params.id
	const filepath = "./music-container/" + id + "/music.mp3"

	res.setHeader("Content-Type", "audio/mp3")

	const streamer = fs.createReadStream(filepath)
	streamer.pipe(res)
})

function setup() {
	const musicContainerFolder = "./music-container";
	const dbFolder = "./db";
	const musicBoxDB = dbFolder + "/MusicBox.db" 

	if(!fs.existsSync(musicContainerFolder)) {
		console.log("[SETUP]: Create music-container folder")
		fs.mkdirSync(musicContainerFolder);
	}
	
	if(!fs.existsSync(dbFolder)) {
		console.log("[SETUP]: Create db folder")
		fs.mkdirSync(dbFolder);
	}

	if(!fs.existsSync(musicBoxDB)) {
		console.log("[SETUP]: Create db/MusicBox.db")
		fs.closeSync(fs.openSync(musicBoxDB, 'w'))
	}

	console.log("[SETUP]: Creating Table")
	setupCreateTable()
}

app.listen(port, () => {
	setup()
	console.log(`[SERVER]: Server running at http://localhost:${port}`)
}) 
