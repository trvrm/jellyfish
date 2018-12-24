import aiohttp
import time
import functools
import sys
import json
import pathlib
from aiohttp import web
import logging
import datetime
import uuid
import asyncpgsa


import sqlalchemy
from sqlalchemy import func

import warnings
from . import config
from . import dynamic_filtering
from . import database

# Database #####################################################################
# async def pool_init(con):

#     await con.set_type_codec(
#         "jsonb", schema="pg_catalog", encoder=dumps, decoder=json.loads, format="text"
#     )
    
async def pool_init(con):
    '''
        There's a bug/discrepancy between asyncpg/SqlAlchemy/asyncpgsa. 
        I've discussed it with https://github.com/nhumrich - this is an acceptable workaround.
    '''
    identity=lambda x:x
    await con.set_type_codec('jsonb', schema='pg_catalog', encoder=identity, decoder=json.loads, format='text')



async def init_app():
    logging.info("init_app()")

    settings = config.connection_settings()

    shared.clauseConstructor = dynamic_filtering.ClauseConstructor(getTables())

    shared.pool = await asyncpgsa.create_pool(
        host=settings["host"],
        user=settings["username"],
        database=settings["database"],
        password=settings["password"],
        port=settings["port"],
        init=pool_init,
    )


async def query(sql):
    async with shared.pool.acquire() as connection:
        return await connection.fetch(sql)


def getTables():
    """
        Run this synchronously at app startup.
    """
    engine = database.create_engine()

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=sqlalchemy.exc.SAWarning)
        metadata = sqlalchemy.MetaData(bind=engine)
        metadata.reflect()

    return metadata.tables


# Utility ######################################################################
def default_encoder(thing):
    if isinstance(thing, uuid.UUID):
        return str(thing)
    if isinstance(thing, (datetime.datetime, datetime.date, datetime.time)):
        return thing.isoformat()


dumps = functools.partial(
    json.dumps, indent=0, sort_keys=True, ensure_ascii=False, default=default_encoder
)


class UserVisibleException(Exception):
    pass


def user_error(s):
    raise UserVisibleException(s)


# Configuration ##############################################################
THIS_DIRECTORY = pathlib.Path(__file__).absolute().parent


def configureLogging():
    logging.basicConfig(
        level=logging.INFO,
        style="{",
        format="{asctime}\t{levelname}\t{name:20}: {message}",
        stream=sys.stderr,
    )


configureLogging()

# Main page ####################################################################


async def index(request):
    INDEX = (THIS_DIRECTORY / "index.html").read_text()
    return web.Response(text=INDEX, content_type="text/html")


# WEBSOCKET ####################################################################


class Shared:
    def __init__(self):
        self.sockets = []
        self.tick_count = 0
        self.clauseConstructor = None

    def flush(self):
        self.sockets = [s for s in self.sockets if not s.closed]


async def broadcast(name, data={}):
    shared.flush()
    for ws in shared.sockets:
        try:
            await send(ws, name, data)
        except Exception as e:
            logging.info(e)


shared = Shared()
message_handlers = dict()


def handle(name):
    def wrapper(func):
        message_handlers[name] = func
        return func

    return wrapper


async def send(ws, name, data={}):
    assert isinstance(name, str)
    # assert isinstance(data,dict), name
    await ws.send_json([name, data], dumps=dumps)


async def process_message(ws, msg):
    logging.info(msg)
    name, data = json.loads(msg.data)

    func = message_handlers.get(name)
    if func:
        try:
            await func(ws, data)
        except UserVisibleException as e:
            await send(ws, "message", {"text": str(e), "level": "warning"})
        except Exception as e:
            logging.exception(e)
            text = str(e)
            await send(ws, "message", {"text": text, "level": "danger"})
    else:
        text = "Unknown message: {}".format(name)
        await send(ws, "message", {"text": text, "level": "warning"})


async def websocket_handler(request):
    logging.info("websocket_handler")

    ws = web.WebSocketResponse()
    await ws.prepare(request)

    shared.sockets.append(ws)

    async for msg in ws:
        logging.debug(ws.status)
        if msg.type == aiohttp.WSMsgType.TEXT:
            await process_message(ws, msg)

        elif msg.type == aiohttp.WSMsgType.ERROR:
            logging.warning(
                "ws connection closed with exception {}".format(ws.exception())
            )

    logging.info("websocket connection closed")

    return ws


# WEBSOCKET HANDLERS ###########################################################
@handle("hello")
async def handle_hello(websocket, data):
    await send(websocket, "hi")
    await send(
        websocket,
        "column_names",
        {"names": ["first", "last", "color", "species", "gender"]},
    )


@handle("ping")
async def handle_ping(websocket, data):
    await send(websocket, "pong")


@handle("query.apply")
async def handle_apply_expression(websocket, expression):
    start = time.time()
    logging.info(expression)
    clause = shared.clauseConstructor(expression)
    Fish = shared.clauseConstructor.tables["fish"]

    sql = sqlalchemy.select(
        [Fish.c.first, Fish.c.last, Fish.c.species, Fish.c.color, Fish.c.gender]
    ).order_by(Fish.c.first, Fish.c.last, Fish.c.species)
    sql = shared.clauseConstructor.apply(sql, expression).limit(30)
    columns = [str(c) for c in sql.columns]

    logging.info(clause)
    logging.info(sql)
    result = await query(sql)

    count_sql = shared.clauseConstructor.apply(
        sqlalchemy.select([func.count(Fish.c.uuid).label("count")]), expression
    )

    r2 = await query(count_sql)
    total = r2[0]["count"]

    # logging.info(result)
    data = {
        "expression": expression,
        "columns": columns,
        "rows": [list(row) for row in result],
        "total": total,
        "duration": round(time.time() - start, 3),
    }
    await send(websocket, "query.result", data)


app = web.Application()
app.router.add_get("/", index)
app.router.add_get("/ws/app", websocket_handler)
