from flask import Flask, render_template

app = Flask(__name__)
app.config['SECRET_KEY'] = 'farspeech12345'


@app.route('/')
def hello_world():
    # return render_template('main.html')
    return render_template('testing.html')


if __name__ == '__main__':
    app.run()
