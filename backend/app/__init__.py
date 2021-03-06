from flask import Flask, jsonify
from flask_cors import CORS
from flask_httpauth import HTTPTokenAuth
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import click
import os
import signal
from flask_marshmallow import Marshmallow
from flask_sso import SSO
from flask_bcrypt import Bcrypt

from app.elastic_index import ElasticIndex
from app.email_service import EmailService
from app.file_server import FileServer
from app.rest_exception import RestException

app = Flask(__name__, instance_relative_config=True)

# Load the default configuration
app.config.from_object('config.default')
# Load the configuration from the instance folder
app.config.from_pyfile('config.py')
# Load the file specified by the APP_CONFIG_FILE environment variable
# Variables defined here will override those in the default configuration
if "APP_CONFIG_FILE" in os.environ:
    app.config.from_envvar('APP_CONFIG_FILE')

# Enable CORS
if(app.config["CORS_ENABLED"]) :
    cors = CORS(app, resources={r"*": {"origins": "*"}})

# Database Configuration
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Flask-Marshmallow provides HATEOAS links
ma = Marshmallow(app)

# Database Migrations
migrate = Migrate(app, db)

# Search System
elastic_index = ElasticIndex(app)

# file Server
file_server = FileServer(app)

# email service
email_service = EmailService(app)

# Single Signon
sso = SSO(app=app)

# Token Authentication
auth = HTTPTokenAuth('Bearer')

# Password Encryption
bcrypt = Bcrypt(app)

@app.cli.command()
def stop():
    """Stop the server."""
    pid = os.getpid()
    if pid:
        print("Stopping server...")
        os.kill(pid, signal.SIGTERM)
        print("Server stopped.")
    else:
        print("Server is not running.")

# Constructing for a problem when building urls when the id is null.
# there is a fix in the works for this, see
# https://github.com/kids-first/kf-api-dathanaservice/pull/219
#handler = lambda error, endpoint, values: ''
def handler(error, endpoint, values=''):
    print("URL Build error:" + str(error))
    return ''
app.url_build_error_handlers.append(handler)

# Handle errors consistently
@app.errorhandler(RestException)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.errorhandler(404)
def handle_404(error):
    return handle_invalid_usage(RestException(RestException.NOT_FOUND, 404))


def _load_data(data_loader):
    data_loader.load_institutions()
    data_loader.load_resources()
    data_loader.load_availability()
    # data_loader.load_icons()
    data_loader.load_categories()
    data_loader.load_resource_categories()
    data_loader.load_users()
    data_loader.load_user_favorites()

@app.cli.command()
def initdb():
    """Initialize the database."""
    from app import data_loader
    data_loader = data_loader.DataLoader()
    _load_data(data_loader)

@app.cli.command()
def cleardb():
    """Delete all information from the database."""
    click.echo('Clearing out the database')
    from app import data_loader
    data_loader = data_loader.DataLoader()
    data_loader.clear()

@app.cli.command()
def initindex():
    """Delete all information from the elastic search Index."""
    click.echo('Loading data into Elastic Search')
    from app import data_loader
    data_loader = data_loader.DataLoader()
    data_loader.build_index()

@app.cli.command()
def clearindex():
    """Delete all information from the elasticsearch index"""
    click.echo('Removing Data from Elastic Search')
    from app import data_loader
    data_loader = data_loader.DataLoader()
    data_loader.clear_index()

@app.cli.command()
def reset():
    """Remove all data and recreate it from the example data files"""
    click.echo('Rebuilding the databases from the example data files')
    from app import data_loader
    data_loader = data_loader.DataLoader()
    data_loader.clear_index()
    data_loader.clear()
    _load_data(data_loader)
    data_loader.build_index()

@app.cli.command()
def loadicons():
    """Load the SVG icon images onto the S3 bucket and create records in the database"""
    click.echo('Loading SVG Images to S3, creating Icon Records')
    from app import data_loader
    data_loader = data_loader.DataLoader()
    data_loader.load_icons()


from app import views
