from . import app
import asyncio
import aiohttp.web
import logging

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(app.init_app())
    logging.info("here we go")
    aiohttp.web.run_app(app.app, host="127.0.0.1", port=9090)
