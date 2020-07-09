import requests
import os
from flask import Flask, render_template
from pathlib import Path

app = Flask(__name__)
url = "https://dialectid.qcri.org/adi17api"

"""
**Important:
    . My Browser Downloads into ~/Downloads/voiceData 
    . Change the filePath variable to be wherever your browser Downloads + / + voiceData
"""
filePath = f"{Path.home()}/Downloads/voiceData"


@app.route('/send-data/')
def ADI_Stream():
    """
        Gets Called From The Front-End
        Request : lastest voice.raw file containing Audio Blobs
        Response : Json Containing every Dialect and Its Probability

    """
    files = []
    payload = {}
    headers = {}

    for file in os.listdir(filePath):
        if ".raw" in file:
            files.append(
                (f"file1", open(f"{filePath}/{file}", 'rb'))
            )
    response = requests.request(
        "POST", url, headers=headers, data=payload, files=[files[-1]],  verify=False)  # Sends The Last File Added To The array( TD: Improve the Logic)
    # Looks Redundant, But It's Required Since the Response is a byte literal (And It Works...)
    return response.text.encode('utf8').decode('utf8')


@app.route('/')
def hello_world():
    return render_template('main.html')


if __name__ == '__main__':
    app.run(debug=True)
