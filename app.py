import requests
import os
from flask import Flask, render_template, request
from pathlib import Path

app = Flask(__name__)
ADI_url = "https://dialectid.qcri.org/adi17api"
NER_url = "http://qatsdemo.cloudapp.net/farasa/requestExecuter.php"


@app.route('/')
def hello_world():
    return render_template('Main.html')


@app.route('/audio-receiver/', methods=['GET', 'POST'])
def File_In():
    # Ignore Error Produced due to 400 Bad Request: KeyError: "file"
    file = request.files["file"]
    files = []
    payload = {}
    headers = {}
    file.save(os.path.join("./audioData", "audio.raw"))
    for file in os.listdir("./audioData"):
        if ".raw" in file:
            files.append(
                (f"file1", open(f"./audioData/{file}", 'rb'))
            )
    response = requests.request(
        "POST", ADI_url, headers=headers, data=payload, files=[files[-1]],  verify=False)

    return response.text.encode('utf8').decode('utf8')


@app.route('/ner-receiver/', methods=['GET', 'POST'])
def name_entity_recognition():
    payload = {
        "query": request.values['text'],
        "task": 5
    }
    headers = {}
    response = requests.request(
        "POST", NER_url, headers=headers, data=payload)
    return(response.text)


if __name__ == '__main__':
    app.run()
