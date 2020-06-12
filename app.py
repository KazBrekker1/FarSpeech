from flask import Flask, send_file
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


@app.route('/')
def hello_world():
    return send_file('templates/index.html')


@socketio.on('json')
def handle_json(json):
    print('received json: ' + str(json))


if __name__ == '__main__':
    socketio.run(app)
