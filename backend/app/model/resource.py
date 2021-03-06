import datetime
import re
from app.model.availability import Availability
from app.model.favorite import Favorite
from app import db
from flask import g


class ThrivResource(db.Model):
    '''A resource is meta data about a website, database, group, institution or other entity that might prove useful
    to medical research, clinical application, or to educate and empower the community'''
    __tablename__ = 'resource'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    last_updated = db.Column(db.DateTime, default=datetime.datetime.now)
    description = db.Column(db.String)
    owner = db.Column(db.String)
    contact_email = db.Column(db.String)
    contact_phone = db.Column(db.String)
    contact_notes = db.Column(db.String)
    website = db.Column(db.String)
    cost = db.Column(db.String)
    type_id = db.Column('type_id', db.Integer(), db.ForeignKey('type.id'))
    institution_id = db.Column('institution_id', db.Integer(), db.ForeignKey('institution.id'))
    availabilities = db.relationship(lambda: Availability,  cascade="all, delete-orphan",
                                     backref=db.backref('resource', lazy=True))
    favorites = db.relationship(lambda: Favorite, cascade="all, delete-orphan",
                                backref=db.backref('resource', lazy=True))
    files = db.relationship("UploadedFile", back_populates="resource")
    categories = db.relationship("ResourceCategory", back_populates="resource")
    approved = db.Column(db.String)

    def favorite_count(self):
        return len(self.favorites)

    def owners(self):
        try:
            return re.split('; |, | ', self.owner)
        except:
            pass

    def user_may_view(self):
        try:
            if self.approved == "Approved":
                return True
            if g.user.role == "Admin":
                return True
            if g.user.email in self.owners():
                return True
        except:
            return False

    def user_may_edit(self):
        try:
            if g.user.role == "Admin":
                return True
            if g.user.email in self.owners():
                return True
        except:
            return False
