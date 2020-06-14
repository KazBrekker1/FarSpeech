from flask import Flask, send_file
from flask_socketio import SocketIO, emit
import urllib.parse
import urllib.request

app = Flask(__name__)
app.config['SECRET_KEY'] = 'farspeech12345'
socketio = SocketIO(app, cors_allowed_origins=[
                    'http://farspeech-flask.herokuapp.com/', 'https://farspeech-flask.herokuapp.com/'])


@app.route('/')
def hello_world():
    return send_file('templates/index.html')


@socketio.on('connect')
def test_connect():
    print("It Connected")


url = "http://qatsdemo.cloudapp.net/farasa/requestExecuter.php"


@socketio.on("Input NER Event")
def processing(data):
    queryvalues = data
    data = urllib.parse.urlencode(queryvalues)
    data = data.encode('utf-8')  # data should be bytes
    req = urllib.request.Request(url, data)
    with urllib.request.urlopen(req) as response:
        the_page = response.read()
        # print(the_page.decode('utf-8'))
        socketio.emit('Output NER Event', {
            "data": the_page.decode('utf-8')
        })


if __name__ == '__main__':
    socketio.run(app)
