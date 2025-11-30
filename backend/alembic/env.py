from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

import os
import sys

# ---------------------------------------------------------
# ADD PROJECT PATH SO ALEMBIC CAN IMPORT app.models
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from app.database.session import Base
from app import models   # IMPORTANT — imports all model metadata


# this is the Alembic Config object, which provides access
# to the values within alembic.ini.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------
# SET METADATA FOR AUTOGENERATE
# ---------------------------------------------------------
target_metadata = Base.metadata


# ---------------------------------------------------------
# RUN MIGRATIONS OFFLINE
# ---------------------------------------------------------
def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------
# RUN MIGRATIONS ONLINE
# ---------------------------------------------------------
def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------
# MAIN EXECUTION
# ---------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
