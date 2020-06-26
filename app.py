from flask import Flask,render_template

url = "http://qatsdemo.cloudapp.net/farasa/requestExecuter.php"
app = Flask(__name__)
app.config['SECRET_KEY'] = 'farspeech12345'


@app.route('/')
def hello_world():
    return render_template('main.html')


if __name__ == '__main__':
    app.run()
