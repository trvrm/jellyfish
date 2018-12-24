import sqlalchemy
from . import config

def create_engine():
    '''
        We use this engine for _synchonous_ tasks, i.e. loading app metadata at startup
        and database population.
    '''
    settings=config.connection_settings()
    assert isinstance(settings, dict)
    url = "postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}".format_map(
        settings
    )
    application_name = settings["application_name"]

    return sqlalchemy.create_engine(
        url,
        connect_args={"application_name": application_name},
        poolclass=sqlalchemy.pool.NullPool,
        use_native_uuid=False,
        use_native_hstore=False,
    )
