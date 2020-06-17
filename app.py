from flask import Flask, send_file

url = "http://qatsdemo.cloudapp.net/farasa/requestExecuter.php"
app = Flask(__name__)
app.config['SECRET_KEY'] = 'farspeech12345'


@app.route('/')
def hello_world():
    return send_file('templates/index.html')


if __name__ == '__main__':
    app.run()
