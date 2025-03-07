const sqlite = require("sqlite3")
const db = new sqlite.Database("./db/MusicBox.db")
const uuid = require("uuid")
const fs = require("fs")

async function addAuthor({ author_id, name, subrciber_count }) {
	db.run("insert into author (author_id, name, subcriber_count) select $id, $name, $sub_count where not exists (select * from author where author_id = $id);", {
		$id: author_id,
		$name: name,
		$sub_count: subrciber_count
	})
}

function addMusic({ title, link_id, author_id, view_count, descriptions, length_seconds, likes }) {
	const id = uuid.v4()
	db.run("insert into music values ($music_id, $title, $author_id, $link_id, $view_count, $descriptions, $length_seconds, $likes)", {
		$music_id: id, 
		$title: title, 
		$link_id: link_id, 
		$author_id: author_id, 
		$view_count: view_count, 
		$descriptions: descriptions, 
		$length_seconds: length_seconds, 
		$likes: likes
	})
	return id
}

async function getAuthorById(id) {
	const sql = `select * from author where author_id = ?`
	return new Promise((res, rej) => {
		db.get(sql, [id], (err, row) => {
			if(err) rej(err)
			res(row)
		})
	})
}

async function getMusicByUUID(id) {
	const sql = `select * from music where music_id = ?`
	return new Promise((resolve, reject) => {
		db.get(sql, [id], (err, row) => {
			if(err) reject(err)
			resolve(row)
		})
	})
}

async function getMusicByMusicId(music_id) {
	const sql = `select * from music where link_id = ?`
	return new Promise((resolve, reject) => {
		db.get(sql, [music_id], (err, row) => {
			if(err) { console.log(err); reject(err)}
			resolve(row)
		})
	})
}

async function getMusicAll() {
	const sql = `select * from music`
	return new Promise((resolve, reject) => {
		db.all(sql, [], (err, row) => {
			if(err) { console.log(err); reject(err)}
			resolve(row)
		})
	})
	
}

async function getMusicAllWithArtist() {
	const sql = `select * from music m join author a where m.author_id = a.author_id`
	return new Promise((resolve, reject) => {
		db.all(sql, [], (err, row) => {
			if(err) { console.log(err); reject(err)}
			resolve(row)
		})
	})
	
}

async function setupCreateTable() {
	fs.readFile("./sql/music-model.sql", (err, data) => {
		const cmd = data.toString().split("\n").join(" ");
		db.run(cmd)
	})
}

module.exports = {
	addMusic, addAuthor, getMusicByUUID, getMusicByMusicId, getAuthorById, getMusicAll, getMusicAllWithArtist, setupCreateTable
}
