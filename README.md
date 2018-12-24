
## Postgres Database setup:

`sudo apt install postgres`

* create a user called `jellyfish`
* create a database called `jellyfish`
* Run this SQL: 

```sql
    create table fish(
        uuid uuid primary key default uuid_generate_v4(),
        first text not null,
        last text not null,
        species text not null,
        color text not null,
        gender text not null
    );


create index on fish(first);
create index on fish(last);
create index on fish(species);
create index on fish(color);
create index on fish(gender);
```

## Config file setup.

Create a json file in this directory called `jellyfish.json`

```json
{
    "application_name":"jellyfish",
    "database":"jellyfish",
    "username":"jellyfish",
    "password":"<enter password here>", 
    "port":5432,
    "host":"localhost"
}
```