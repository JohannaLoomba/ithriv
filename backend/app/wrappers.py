from functools import wraps
from app import RestException
from flask import g


def requires_roles(*roles):
    def wrapper(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if g.user.role not in roles:
                raise RestException(RestException.PERMISSION_DENIED, 403)
            return f(*args, **kwargs)
        return wrapped
    return wrapper
