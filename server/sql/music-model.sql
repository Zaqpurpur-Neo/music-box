create table if not exists author (
	author_id varchar(255) not null primary key,
	name varchar(255) not null,
	subcriber_count int
);

create table if not exists music (
	music_id char(128) not null primary key,
	title varchar(255) not null,
	author_id varchar(255) not null,
	link_id varchar(50) not null,
	view_count varchar(255) not null,
	descriptions text not null,
	length_seconds not null,
	likes int,

	foreign key (author_id) references author(author_id)
);

