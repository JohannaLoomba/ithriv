import unittest

from app import app

class TestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()

    def assertSuccess(self, rv):
        self.assertTrue(rv.status_code >= 200 and rv.status_code < 300,
                        "BAD Response:" + rv.status + ".")

    def test_base_endpoint(self):
        rv = self.app.get('/api',
                          follow_redirects=True,
                          content_type="application/json")
        self.assertSuccess(rv)