from flask import Flask, send_file

app = Flask(__name__)


@app.route('/')
def hello_world():
    return send_file('templates/index.html')  # Tried rendering the file and other Flask Methods and the Error Still persists


if __name__ == '__main__':
    app.run()
