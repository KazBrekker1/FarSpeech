from flask import Flask, send_file
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'farspeech12345'
socketio = SocketIO(app)


@app.route('/')
def hello_world():
    return send_file('templates/index.html')


@socketio.on('json')
def handle_json(json):
    print('received json: ' + str(json))


@socketio.on('connect')
def test_connect():
    print("It Connected")

""" 
EVENT HANDLER
handels: my event (from OnResult in the front end)
"""
@socketio.on('my event')
def trial(data):
    print(data)
    """ 
    EVENT EMMITTER
    event name : event 2 
    """
    socketio.emit('event 2', {
        "data": "Emmited data From Backend"
    })


if __name__ == '__main__':
    socketio.run(app)
