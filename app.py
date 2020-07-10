import requests
import os
from flask import Flask, render_template, request
from pathlib import Path

app = Flask(__name__)
url = "https://dialectid.qcri.org/adi17api"


@app.route('/audio-reciver/', methods=['GET', 'POST'])
def File_In():
    # Ignore Error Produced due to 400 Bad Request: KeyError: "file"
    file = request.files["file"]
    files = []
    payload = {}
    headers = {}
    file.save(os.path.join("./audioData", "audio.raw"))
    for file in os.listdir("./audioData"):
        files.append(
            (f"file1", open(f"./audioData/{file}", 'rb'))
        )
    response = requests.request(
        "POST", url, headers=headers, data=payload, files=[files[-1]],  verify=False)

    return response.text.encode('utf8').decode('utf8')


@app.route('/')
def hello_world():
    return render_template('main.html')


if __name__ == '__main__':
    app.run()
